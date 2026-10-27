import { stripVTControlCharacters } from 'node:util';
import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  lstatSync,
  mkdirSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertSafeInternalSymlink } from './repository-symlink-safety.mjs';
import { TypegenError } from './typegen-error.mjs';

export const TYPEGEN_MANIFEST = '.demo-typegen.json';
export const GENERATED_LIMITS = {
  fileBytes: 8 * 1024 * 1024,
  totalBytes: 16 * 1024 * 1024,
  diffBytes: 16 * 1024 * 1024,
};
export { TypegenError } from './typegen-error.mjs';
const FAILURE_OUTPUT = Symbol('failureOutput');
const fail = (code) => {
  throw new TypegenError(code);
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
// Runtime paths can point into an isolated repository checkout or temporary workspace. They must
// never cause Turbopack to trace the provisioner repository when this helper is bundled into a workflow.
const runtimePath = (root, ...segments) => path.join(/* turbopackIgnore: true */ root, ...segments);
export const typegenDigest = (value) => hash(JSON.stringify(value));
export const generationToolchainDigest = (root) =>
  typegenDigest({
    node: process.version,
    pnpm: '10.34.5',
    lockfile: hash(readFileSync(runtimePath(root, 'pnpm-lock.yaml'))),
  });
function safePath(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length < 512 &&
    !value.includes('\\') &&
    !/[\0\r\n]/.test(value) &&
    !path.posix.isAbsolute(value) &&
    value
      .split('/')
      .every(
        (part) => part && part !== '.' && part !== '..' && !['node_modules', '.git'].includes(part),
      )
  );
}
function assertPath(root, relative) {
  if (!safePath(relative)) fail('REPAIR_TYPEGEN_CONFIG_INVALID');
  const parts = [];
  for (const part of relative.split('/')) {
    parts.push(part);
    const current = runtimePath(root, ...parts);
    if (existsSync(current) && lstatSync(current).isSymbolicLink())
      fail('REPAIR_TYPEGEN_CONFIG_INVALID');
  }
}
export function readTypegenPlan(root) {
  const location = runtimePath(root, TYPEGEN_MANIFEST);
  if (!existsSync(location)) return null;
  assertPath(root, TYPEGEN_MANIFEST);
  let plan;
  try {
    plan = JSON.parse(readFileSync(location, 'utf8'));
  } catch {
    fail('REPAIR_TYPEGEN_CONFIG_INVALID');
  }
  if (
    ![1, 2].includes(plan?.schemaVersion) ||
    !Array.isArray(plan.studios) ||
    !Array.isArray(plan.web) ||
    !Array.isArray(plan.sdk)
  )
    fail('REPAIR_TYPEGEN_CONFIG_INVALID');
  for (const sdk of plan.sdk) assertPath(root, sdk);
  const outputs = [];
  for (const studio of plan.studios) {
    assertPath(root, studio.directory);
    assertPath(root, studio.output);
    if (
      !studio.output.startsWith(studio.directory + '/') ||
      !studio.output.endsWith('.json') ||
      ['package.json', 'tsconfig.json', 'vercel.json'].includes(
        path.posix.basename(studio.output),
      ) ||
      path.posix.basename(studio.output).startsWith('.') ||
      typeof studio.enforceRequiredFields !== 'boolean' ||
      (studio.workspace !== null && !/^[\w-]+$/.test(studio.workspace))
    )
      fail('REPAIR_TYPEGEN_CONFIG_INVALID');
    outputs.push(studio.output);
  }
  for (const target of plan.web) {
    for (const item of [target.directory, target.output, target.config, target.schema])
      assertPath(root, item);
    if (target.outputPackage) {
      assertPath(root, target.outputPackage.directory);
      const manifestPath = `${target.outputPackage.directory}/package.json`;
      assertPath(root, manifestPath);
      let manifest;
      try {
        manifest = JSON.parse(readFileSync(runtimePath(root, manifestPath), 'utf8'));
      } catch {
        fail('REPAIR_TYPEGEN_CONFIG_INVALID');
      }
      if (
        target.outputPackage.directory === '.github' ||
        target.outputPackage.directory.startsWith('.github/') ||
        manifest?.name !== target.outputPackage.name
      )
        fail('REPAIR_TYPEGEN_CONFIG_INVALID');
    }
    if (
      !plan.studios.some((s) => s.output === target.schema) ||
      (target.outputPackage
        ? plan.schemaVersion !== 2 ||
          typeof target.outputPackage.name !== 'string' ||
          !target.outputPackage.name ||
          !safePath(target.outputPackage.directory) ||
          !target.output.startsWith(target.outputPackage.directory + '/')
        : !target.output.startsWith(target.directory + '/')) ||
      !target.output.endsWith('.ts') ||
      /(?:^|\/)(?:sanity\.(?:cli|config)|next\.config|vite\.config|.*\.test|.*\.spec)\.ts$/.test(
        target.output,
      ) ||
      !target.config.startsWith(target.directory + '/') ||
      !Array.isArray(target.paths) ||
      !target.paths.length ||
      target.paths.some((p) => typeof p !== 'string' || !p || /[\0\r\n]/.test(p))
    )
      fail('REPAIR_TYPEGEN_CONFIG_INVALID');
    for (const pattern of target.paths) globRegex(pattern);
    if (
      plan.sdk.some((s) => target.directory === s || target.output.startsWith(s + '/')) ||
      (target.outputPackage &&
        [...plan.web, ...plan.studios.map((studio) => ({ directory: studio.directory }))].some(
          (surface) =>
            surface.directory === target.outputPackage.directory ||
            surface.directory.startsWith(target.outputPackage.directory + '/') ||
            target.outputPackage.directory.startsWith(surface.directory + '/'),
        )) ||
      (target.outputPackage &&
        plan.sdk.some(
          (directory) =>
            directory === target.outputPackage.directory ||
            directory.startsWith(target.outputPackage.directory + '/') ||
            target.outputPackage.directory.startsWith(directory + '/'),
        ))
    )
      fail('REPAIR_TYPEGEN_CONFIG_INVALID');
    outputs.push(target.output);
  }
  if (
    new Set(outputs).size !== outputs.length ||
    outputs.some((p) => outputs.some((other) => p !== other && other.startsWith(p + '/')))
  )
    fail('REPAIR_TYPEGEN_CONFIG_INVALID');
  if (plan.web.length && !plan.studios.length) fail('REPAIR_TYPEGEN_CONFIG_INVALID');
  return plan;
}
export function generatedPaths(plan) {
  return plan
    ? [...plan.studios.map((s) => s.output), ...plan.web.map((w) => w.output)].sort()
    : [];
}
export function readGenerated(root, plan) {
  let bytes = 0;
  const files = [];
  for (const relative of generatedPaths(plan)) {
    assertPath(root, relative);
    const absolute = runtimePath(root, relative);
    if (!existsSync(absolute) || !lstatSync(absolute).isFile())
      fail('REPAIR_TYPEGEN_OUTPUT_INVALID');
    const size = lstatSync(absolute).size;
    bytes += size;
    if (size > GENERATED_LIMITS.fileBytes || bytes > GENERATED_LIMITS.totalBytes)
      fail('REPAIR_TYPEGEN_OUTPUT_LIMIT');
    const buffer = readFileSync(absolute);
    const content = buffer.toString('utf8');
    if (!Buffer.from(content, 'utf8').equals(buffer)) fail('REPAIR_TYPEGEN_OUTPUT_INVALID');
    // Generated content is still repository-controlled; never publish credential-bearing output.
    if (
      /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|sk_[A-Za-z0-9_-]{20,}|sk[A-Za-z0-9]{50,}|vcp_[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]{20,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})|(?:token|password|secret|api[_-]?key|private[_-]?key)['"]?\s*[:=]\s*["'][^"'\s]{12,}["']/i.test(
        content,
      ) ||
      /\bBearer\s+[A-Za-z0-9_./+=-]{20,}/i.test(content)
    )
      fail('REPAIR_TYPEGEN_OUTPUT_UNSAFE');
    if (relative.endsWith('.json')) {
      try {
        const schema = JSON.parse(content);
        if (
          !Array.isArray(schema) ||
          schema.some(
            (node) => !node || typeof node.name !== 'string' || typeof node.type !== 'string',
          )
        )
          fail('REPAIR_TYPEGEN_OUTPUT_INVALID');
      } catch {
        fail('REPAIR_TYPEGEN_OUTPUT_INVALID');
      }
    } else if (!/generated/i.test(content) || !/export\s+(?:type|interface)\s/.test(content))
      fail('REPAIR_TYPEGEN_OUTPUT_INVALID');
    files.push({ path: relative, sha256: hash(content), bytes: size });
  }
  return files;
}
function walk(root, prefix = '', excluded = [], repositoryRoot = realpathSync(root)) {
  const files = [];
  for (const name of readdirSync(root).sort()) {
    if (['node_modules', '.git', '.next', '.sanity', 'dist', 'out'].includes(name)) continue;
    const absolute = runtimePath(root, name),
      relative = prefix ? `${prefix}/${name}` : name;
    if (excluded.some((p) => relative === p || relative.startsWith(p + '/'))) continue;
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) {
      assertSafeInternalSymlink(absolute, repositoryRoot);
      continue;
    }
    if (stat.isDirectory()) files.push(...walk(absolute, relative, excluded, repositoryRoot));
    else files.push(relative);
  }
  return files;
}
function globRegex(glob) {
  // Normalization emits directory globs and the web-root form only. Reject unsupported
  // patterns instead of widening discovery.
  const match = /^(?:(.*?)\/)?\*\*\/\*\.\{([a-z,]+)\}$/.exec(glob);
  if (!match) fail('REPAIR_TYPEGEN_CONFIG_INVALID');
  const directory = match[1] ?? '';
  if (
    directory &&
    (directory.split('/').some((part) => /[*?[\]{}]/.test(part)) ||
      !directory.split('/').some((part) => part !== '.' && part !== '..'))
  )
    fail('REPAIR_TYPEGEN_CONFIG_INVALID');
  return { directory, extensions: match[2].split(',') };
}
export function expectedQueries(root, target, plan) {
  const names = new Set();
  const selected = new Set();
  for (const pattern of target.paths) {
    const glob = globRegex(pattern);
    const directory = path.posix.normalize(path.posix.join(target.directory, glob.directory));
    assertPath(root, directory);
    const owner = target.outputPackage?.directory;
    if (
      owner &&
      directory !== owner &&
      !directory.startsWith(owner + '/') &&
      directory !== target.directory &&
      !directory.startsWith(target.directory + '/')
    )
      fail('REPAIR_TYPEGEN_CONFIG_INVALID');
    if (plan.sdk.some((s) => directory === s || directory.startsWith(s + '/')))
      fail('REPAIR_TYPEGEN_CONFIG_INVALID');
    if (!existsSync(runtimePath(root, directory))) fail('REPAIR_TYPEGEN_QUERY_DISCOVERY_FAILED');
    for (const relative of walk(
      runtimePath(root, directory),
      directory,
      plan.sdk,
      realpathSync(root),
    )) {
      const file = relative;
      if (
        glob.extensions.includes(path.extname(file).slice(1)) &&
        !generatedPaths(plan).includes(relative) &&
        !plan.sdk.some((s) => relative.startsWith(s + '/'))
      )
        selected.add(relative);
    }
  }
  for (const file of selected) {
    const source = readFileSync(runtimePath(root, file), 'utf8');
    if (/\b(?:defineQuery|groq)\s+as\s+[A-Za-z_$]/.test(source))
      fail('REPAIR_TYPEGEN_QUERY_DISCOVERY_FAILED');
    // Tokenize without executing repository code. Comments and string contents are not queries.
    const tokens = [];
    const lexer =
      /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|[A-Za-z_$][\w$]*|[^\s]/g;
    for (const token of source.matchAll(lexer)) {
      const text = token[0];
      if (text.startsWith('//') || text.startsWith('/*')) continue;
      tokens.push(text.startsWith('`') ? '`' : /^["']/.test(text) ? 'literal' : text);
    }
    for (let index = 0; index < tokens.length; index++) {
      if (
        !(
          (tokens[index] === 'defineQuery' && tokens[index + 1] === '(') ||
          (tokens[index] === 'groq' && tokens[index + 1] === '`')
        )
      )
        continue;
      if (tokens[index - 1] !== '=') fail('REPAIR_TYPEGEN_QUERY_DISCOVERY_FAILED');
      let declaration = index - 2;
      while (
        declaration >= 0 &&
        !['const', 'let', 'var', ';', '=', '{', '}'].includes(tokens[declaration])
      )
        declaration--;
      if (!['const', 'let', 'var'].includes(tokens[declaration]))
        fail('REPAIR_TYPEGEN_QUERY_DISCOVERY_FAILED');
      const name = tokens[declaration + 1];
      if (!/^[A-Za-z_$][\w$]*$/.test(name) || names.has(name))
        fail('REPAIR_TYPEGEN_QUERY_DISCOVERY_FAILED');
      names.add(name);
    }
  }
  return [...names].sort();
}
function generatedQueryNames(content) {
  // Keep comments as tokens so metadata inside a string or block comment cannot impersonate a declaration.
  const tokens = [
    ...content.matchAll(
      /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|[A-Za-z_$][\w$]*|[^\s]/g,
    ),
  ].map((match) => match[0]);
  return tokens.flatMap((token, index) => {
    const name = /^\/\/ Variable: ([A-Za-z_$][\w$]*)$/.exec(token)?.[1];
    return name &&
      tokens[index + 1]?.startsWith('// Query: ') &&
      tokens[index + 2] === 'export' &&
      tokens[index + 3] === 'type' &&
      /^[A-Za-z_$][\w$]*$/.test(tokens[index + 4] ?? '') &&
      tokens[index + 5] === '='
      ? [name]
      : [];
  });
}
export function typegenCommands(root, plan) {
  if (!plan) return [];
  const commands = [];
  for (const studio of plan.studios)
    commands.push({
      cwd: runtimePath(root, studio.directory),
      label: `${studio.directory} schema-extract`,
      args: [
        'exec',
        'sanity',
        'schema',
        'extract',
        '--force',
        '--path',
        path.posix.relative(studio.directory, studio.output),
        ...(studio.enforceRequiredFields ? ['--enforce-required-fields'] : []),
        ...(studio.workspace ? ['--workspace', studio.workspace] : []),
      ],
    });
  for (const web of plan.web)
    commands.push({
      cwd: runtimePath(root, web.directory),
      label: `${web.directory} sanity-typegen`,
      args: ['exec', 'sanity', 'typegen', 'generate'],
    });
  return commands;
}
/** Measure the actual generated diff, in an isolated directory without repository Git configuration. */
export function generatedDiffBytes(root, originals, deadline = Date.now() + 180000) {
  const temporary = mkdtempSync(runtimePath(tmpdir(), 'sanity-generated-diff-'));
  try {
    for (const side of ['before', 'after']) mkdirSync(runtimePath(temporary, side));
    for (const [relative, original] of Object.entries(originals)) {
      assertPath(root, relative);
      for (const [side, content] of [
        ['before', original],
        ['after', readFileSync(runtimePath(root, relative), 'utf8')],
      ]) {
        if (content === null) continue;
        const file = runtimePath(temporary, side, relative);
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, content);
      }
    }
    const result = spawnSync(
      'git',
      [
        '-c',
        'core.quotePath=false',
        'diff',
        '--no-index',
        '--no-ext-diff',
        '--no-textconv',
        '--text',
        '--',
        'before',
        'after',
      ],
      {
        cwd: temporary,
        encoding: 'utf8',
        maxBuffer: GENERATED_LIMITS.diffBytes + 65536,
        timeout: Math.max(1, deadline - Date.now()),
        env: {
          PATH: process.env.PATH,
          HOME: temporary,
          GIT_CONFIG_NOSYSTEM: '1',
          GIT_CONFIG_GLOBAL: '/dev/null',
        },
      },
    );
    if (result.error?.code === 'ENOBUFS') fail('REPAIR_TYPEGEN_OUTPUT_LIMIT');
    if (result.error?.code === 'ETIMEDOUT' || Date.now() >= deadline) fail('REPAIR_TIME_LIMIT');
    if (result.error || result.signal || ![0, 1].includes(result.status))
      fail('REPAIR_TYPEGEN_FAILED');
    const diff = result.stdout.replace(/^(?:diff --git |--- |\+\+\+ ).*$/gm, (line) =>
      line.replace(/\b([ab])\/(?:before|after)\//g, '$1/'),
    );
    const bytes = Buffer.byteLength(diff);
    if (bytes > GENERATED_LIMITS.diffBytes) fail('REPAIR_TYPEGEN_OUTPUT_LIMIT');
    return bytes;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
export function runSanityTypegen(root, run, deadline, options = {}) {
  const plan = readTypegenPlan(root);
  if (!plan || !plan.web.length) return null;
  const started = Date.now();
  const paths = generatedPaths(plan);
  let originalBytes = 0;
  for (const p of paths) {
    assertPath(root, p);
    const size = existsSync(runtimePath(root, p)) ? lstatSync(runtimePath(root, p)).size : 0;
    originalBytes += size;
    if (size > GENERATED_LIMITS.fileBytes || originalBytes > GENERATED_LIMITS.totalBytes)
      fail('REPAIR_TYPEGEN_OUTPUT_LIMIT');
  }
  const before = new Map(
    paths.map((p) => [
      p,
      existsSync(runtimePath(root, p)) ? readFileSync(runtimePath(root, p), 'utf8') : null,
    ]),
  );
  const sourceSnapshot = () =>
    Object.fromEntries(
      walk(runtimePath(root))
        .filter(
          (p) =>
            !paths.includes(p) &&
            !['next-env.d.ts', '.env.local'].includes(path.posix.basename(p)) &&
            !p.endsWith('.tsbuildinfo'),
        )
        .map((p) => [p, hash(readFileSync(runtimePath(root, p)))]),
    );
  const sources = JSON.stringify(sourceSnapshot());
  const queries = plan.web.map((w) => expectedQueries(root, w, plan));
  if (options.prepare) options.prepare(paths);
  else
    for (const p of paths) {
      mkdirSync(path.dirname(runtimePath(root, p)), { recursive: true });
      rmSync(runtimePath(root, p), { force: true });
    }
  for (const command of typegenCommands(root, plan)) {
    if (Date.now() >= deadline) fail('REPAIR_TIME_LIMIT');
    const result = run(command.args, command.cwd, deadline);
    if (result.status !== 0 || result.error || result.signal) {
      const output = stripVTControlCharacters(
        String(result.stdout ?? '') + String(result.stderr ?? ''),
      );
      const missingGlobal = [
        'React',
        'require',
        'exports',
        'module',
        '__dirname',
        '__filename',
        'self',
        'Buffer',
        'crypto',
        'global',
        'globalThis',
        'TextEncoder',
        'TextDecoder',
        'ReadableStream',
        'WritableStream',
        'TransformStream',
        'URL',
        'URLSearchParams',
        'fetch',
        'Headers',
        'Request',
        'Response',
        'AbortController',
        'AbortSignal',
        'Event',
        'EventTarget',
        'CustomEvent',
        'ProgressEvent',
        'CloseEvent',
        'ErrorEvent',
        'MessageEvent',
        'MessageChannel',
        'MessagePort',
        'BroadcastChannel',
        'File',
        'Blob',
        'FormData',
        'navigator',
        'document',
        'window',
        'localStorage',
        'sessionStorage',
        'HTMLElement',
      ].find((name) => output.includes(`${name} is not defined`));
      const reason = missingGlobal
        ? 'runtimeGlobalMissing'
        : result.error?.code === 'ETIMEDOUT'
          ? 'timedOut'
          : /Nonexistent flag|Unexpected argument|Unknown flag/.test(output)
            ? 'unsupportedCliFlag'
            : /EACCES|Permission denied|EROFS/.test(output)
              ? 'permissionDenied'
              : /Cannot find module|MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND/.test(output)
                ? 'dependencyMissing'
                : /projectId|project ID/.test(output)
                  ? 'projectConfiguration'
                  : /dataset/.test(output)
                    ? 'datasetConfiguration'
                    : /workspace/.test(output)
                      ? 'workspaceConfiguration'
                      : /ENOTFOUND|ECONN|ETIMEDOUT|fetch failed/.test(output)
                        ? 'networkDependency'
                        : /SyntaxError|TypeError|ReferenceError/.test(output)
                          ? 'configurationExecution'
                          : 'commandFailed';
      const failure = new TypegenError(
        command.label.endsWith('schema-extract')
          ? ['exports', 'module', 'require'].includes(missingGlobal)
            ? 'REPAIR_SCHEMA_MODULE_FORMAT'
            : 'REPAIR_SCHEMA_EXTRACTION_FAILED'
          : 'REPAIR_TYPEGEN_FAILED',
        reason,
      );
      failure.command = {
        missingGlobal: missingGlobal ?? null,
        exitCode: result.status,
        errorCode: ['ENOENT', 'EACCES', 'ETIMEDOUT', 'ENOBUFS'].includes(result.error?.code)
          ? result.error.code
          : null,
        signal: ['SIGTERM', 'SIGKILL'].includes(result.signal) ? result.signal : null,
        outputBytes: Buffer.byteLength(output),
      };
      failure[FAILURE_OUTPUT] = output;
      throw failure;
    }
  }
  if (JSON.stringify(sourceSnapshot()) !== sources) fail('REPAIR_SOURCE_MUTATED');
  const outputs = readGenerated(root, plan);
  for (const [index, target] of plan.web.entries()) {
    const content = readFileSync(runtimePath(root, target.output), 'utf8');
    // Sanity can capitalize, sanitize, or disambiguate the exported type identifier.
    // Its generated Variable/Query metadata binds each declaration to the source query.
    const declarations = generatedQueryNames(content);
    for (const name of queries[index]) {
      if (declarations.filter((variable) => variable === name).length !== 1)
        fail('REPAIR_TYPEGEN_QUERY_DISCOVERY_FAILED');
    }
  }
  const diffBytes = generatedDiffBytes(root, Object.fromEntries(before), deadline);
  return {
    planDigest: typegenDigest(plan),
    toolchainDigest: generationToolchainDigest(root),
    outputs,
    diffBytes,
    sizes: {
      files: Object.fromEntries(outputs.map((o) => [o.path, o.bytes])),
      totalBytes: outputs.reduce((n, o) => n + o.bytes, 0),
      diffBytes,
    },
    queryCount: queries.reduce((n, q) => n + q.length, 0),
    durationMs: Date.now() - started,
  };
}
function printFailureOutput(error) {
  const output = error?.[FAILURE_OUTPUT];
  if (typeof output !== 'string') return;
  const sanitized = [...stripVTControlCharacters(output)]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && (code < 127 || code > 159));
    })
    .join('');
  const lines = sanitized.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  for (const line of lines.slice(-40)) console.error(`typegen| ${line.slice(0, 300)}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (
    process.env.DEMO_TYPEGEN_READY === '1' &&
    (process.argv.includes('--ensure') || process.argv.includes('--check'))
  )
    process.exit(0);
  const root = path.resolve(/* turbopackIgnore: true */ process.argv[2] ?? '.'),
    check = process.argv.includes('--check');
  try {
    const plan = readTypegenPlan(root),
      paths = generatedPaths(plan);
    for (const p of paths)
      if (
        existsSync(runtimePath(root, p)) &&
        lstatSync(runtimePath(root, p)).size > GENERATED_LIMITS.fileBytes
      )
        fail('REPAIR_TYPEGEN_OUTPUT_LIMIT');
    const before = paths.map((p) =>
      existsSync(runtimePath(root, p)) ? hash(readFileSync(runtimePath(root, p))) : null,
    );
    if (!(process.argv.includes('--run-script') && process.env.DEMO_TYPEGEN_READY === '1'))
      runSanityTypegen(
        root,
        (args, cwd, deadline) =>
          spawnSync('pnpm', args, {
            cwd,
            encoding: 'utf8',
            timeout: Math.max(1, deadline - Date.now()),
            maxBuffer: 2097152,
            env: {
              ...process.env,
              npm_config_ignore_scripts: 'true',
              npm_config_ignore_pnpmfile: 'true',
            },
          }),
        Date.now() + 180000,
      );
    if (check)
      for (const [index, p] of paths.entries()) {
        const tracked = spawnSync('git', ['ls-files', '--error-unmatch', '--', p], {
          cwd: root,
          stdio: 'pipe',
        });
        if (tracked.status !== 0 || before[index] !== hash(readFileSync(runtimePath(root, p))))
          fail('REPAIR_TYPEGEN_STALE');
      }
    if (process.argv.includes('--run-script')) {
      const script = process.argv[process.argv.indexOf('--run-script') + 1];
      if (!['dev', 'build', 'typecheck', 'check-types'].includes(script))
        fail('REPAIR_TYPEGEN_CONFIG_INVALID');
      const result = spawnSync(
        'pnpm',
        [...(script === 'dev' ? ['--parallel'] : []), '--recursive', '--if-present', script],
        { cwd: root, stdio: 'inherit', env: { ...process.env, DEMO_TYPEGEN_READY: '1' } },
      );
      process.exitCode = result.status ?? 1;
    }
  } catch (error) {
    printFailureOutput(error);
    console.error(error instanceof TypegenError ? error.code : 'REPAIR_TYPEGEN_FAILED');
    process.exitCode = 1;
  }
}

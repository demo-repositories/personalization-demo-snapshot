/** Error contract shared by TypeGen helpers and workflow-facing failure mapping. */
export class TypegenError extends Error {
  constructor(code, reason) {
    super(code);
    this.code = code;
    this.reason = reason;
  }
}

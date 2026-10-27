'use server';

export async function newsletterSubmission(formData: FormData) {
  const email = formData.get('email');
  console.log('🚀 ~ newsletterSubmission ~ email:', email);
}

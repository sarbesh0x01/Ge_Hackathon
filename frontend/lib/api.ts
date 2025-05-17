// Example API client function
export async function analyzeImages(preImage: File, postImage: File) {
  const formData = new FormData();
  formData.append('pre_image', preImage);
  formData.append('post_image', postImage);

  const response = await fetch('/api/proxy/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze images');
  }

  return response.json();
}

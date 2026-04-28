import { requestJson } from './http'

export type UploadBookCoverResponse = {
  url: string
}

export async function uploadBookCoverRequest(accessToken: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return requestJson<UploadBookCoverResponse>('/uploads/book-covers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })
}

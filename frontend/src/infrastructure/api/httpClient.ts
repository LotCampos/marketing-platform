const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

export async function httpGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    )
  }

  return response.json() as Promise<T>
}

export async function httpPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch (e) {
    }

    const errorMessage = `API request failed: ${response.status} ${response.statusText}`
    const error = new Error(errorMessage)
    
    ;(error as any).response = { data: errorData }
    
    throw error
  }

  return response.json() as Promise<T>
}
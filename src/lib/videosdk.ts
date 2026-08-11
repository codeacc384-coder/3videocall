const VIDEOSDK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI0NjI0NWM0Yy04ZDgzLTQwMzUtODFkYS03MzRlN2QyOWM1OTUiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc4NjM0NTc1OSwiZXhwIjoxNzg4OTM3NzU5fQ.P5nprSwQj7ol0gLFmwti1wa7knC8DksYICla7u-kqaI';

export const VIDEOSDK_API_KEY = '46245c4c-8d83-4035-81da-734e7d29c595';
export { VIDEOSDK_TOKEN };

export async function createVideoSDKRoom(): Promise<string> {
  const res = await fetch('https://api.videosdk.live/v2/rooms', {
    method: 'POST',
    headers: {
      Authorization: VIDEOSDK_TOKEN,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  return data.roomId as string;
}

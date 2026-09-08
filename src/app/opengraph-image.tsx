import { ogImageContentType, ogImageSize, renderOgImage } from '@/lib/ogImage'

export const runtime = 'nodejs'
export const alt = 'Ahmed Amin | Full-Stack Software Engineer'
export const size = ogImageSize
export const contentType = ogImageContentType

export default async function Image() {
  return renderOgImage()
}

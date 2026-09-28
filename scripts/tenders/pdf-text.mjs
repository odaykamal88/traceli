import { PDFDocument, PDFName, PDFArray, decodePDFRawStream } from 'pdf-lib'

/** Decode the text emitted by pdf-lib's standard-font drawText, including every page footer. */
export async function tenderPdfPageText(bytes) {
  const pdf=await PDFDocument.load(bytes)
  return pdf.getPages().map(page=>{
    const contents=page.node.lookup(PDFName.of('Contents'))
    const streams=contents instanceof PDFArray?contents.asArray():[contents]
    return streams.flatMap(stream=>{
      const operators=Buffer.from(decodePDFRawStream(pdf.context.lookup(stream)).decode()).toString('latin1')
      return [...operators.matchAll(/<([0-9a-f]+)>\s*Tj/gi)].map(match=>Buffer.from(match[1],'hex').toString('latin1'))
    }).join('\n')
  })
}

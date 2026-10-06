// YES24 분류명(예: "국내도서-소설/시/희곡")을 내 분야 목록으로 바꿔요
export function mapCategory(sortNm: string): string {
  const s = sortNm ?? ''
  if (s.includes('소설')) return '소설'
  if (s.includes('에세이')) return '에세이'
  if (s.includes('인문')) return '인문'
  if (s.includes('경제') || s.includes('경영')) return '경제/경영'
  if (s.includes('자기계발')) return '자기계발'
  if (s.includes('과학')) return '과학'
  if (s.includes('역사')) return '역사'
  if (s.includes('만화')) return '만화'
  return '기타'
}

// "한강 저" → "한강", "구병모,권지예 등저" → "구병모,권지예"
export function cleanAuthor(author: string): string {
  const first = (author ?? '').split('/')[0].trim()
  return first.replace(/\s+(저|등저|글|지음|공저|편저|편|그림|역)$/, '').trim()
}
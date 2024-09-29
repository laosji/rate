addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 获取网页内容
  const response = await fetch('https://cms.hangseng.com/cms/emkt/pmo/grp06/p04/chi/index.html')
  const html = await response.text()

  // 使用正则表达式或 DOM 解析库来提取数据
  // 这里使用一个简单的正则表达式作为示例
  const data = []
  const regex = /<tr>[\s\S]*?<td.*?>(.*?)<\/td>[\s\S]*?<td.*?>(.*?)<\/td>[\s\S]*?<td.*?>(.*?)<\/td>[\s\S]*?<\/tr>/g
  let match

  while ((match = regex.exec(html)) !== null) {
    data.push({
      currency: match[1].trim(),
      term: match[2].trim(),
      rate: match[3].trim()
    })
  }

  // 返回 JSON 格式的数据
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
}

# Page snapshot

```yaml
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- dialog "Build Error":
  - text: Build Error
  - button "Copy Stack Trace":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - link "Learn more about enabling Node.js inspector for server code with Chrome DevTools":
    - /url: https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code
    - img
  - paragraph: "Error: × Unexpected token `div`. Expected jsx identifier"
  - img
  - text: ./app/(admin)/admin/canchas/page.tsx
  - button "Open in editor":
    - img
  - text: "Error: × Unexpected token `div`. Expected jsx identifier ╭─[C:\\Users\\Chinoo\\OneDrive\\Documentos\\augment-projects\\turnero de padel\\turnero-padel\\app\\(admin)\\admin\\canchas\\page.tsx:149:1] 146 │ 147 │ if (loading) { 148 │ return ( 149 │ <div className=\"container mx-auto p-6\"> · ─── 150 │ <div className=\"flex items-center justify-center h-64\"> 151 │ <div className=\"text-lg\">Cargando canchas...</div> 152 │ </main> ╰──── Caused by: Syntax Error"
  - contentinfo:
    - paragraph: This error occurred during the build process and can only be dismissed by fixing the error.
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- link "Next.js 15.2.4 (stale)":
  - /url: https://nextjs.org/docs/messages/version-staleness
  - img
  - text: Next.js 15.2.4 (stale)
- img
- alert
```
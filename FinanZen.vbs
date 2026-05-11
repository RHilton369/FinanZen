Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Caminho base absoluto dinâmico (onde o VBScript está localizado)
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Iniciar Backend (Considerando uso de npm start ou ts-node para produção)
' Se a máquina destino possuir node instalado e as dependências na pasta:
WshShell.Run "cmd /c cd /d """ & strPath & "\backend"" && npm start", 0, False
WScript.Sleep 2000

' 2. Iniciar Frontend (Next.js Standalone)
' O Next.js standalone cria um server.js que pode ser rodado diretamente com node
WshShell.Run "cmd /c cd /d """ & strPath & "\frontend"" && node server.js", 0, False
WScript.Sleep 3000

' 3. Aguardar inicialização e abrir o navegador
WScript.Sleep 5000 
WshShell.Run "http://localhost:3000", 1, False


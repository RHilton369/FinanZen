[Setup]
AppName=FinanZen Enterprise
AppVersion=1.0.0
AppPublisher=Antigravity Labs
DefaultDirName={autopf}\FinanZen
DefaultGroupName=FinanZen
UninstallDisplayIcon={app}\favicon.ico
Compression=lzma2
SolidCompression=yes
OutputDir=.\Output
OutputBaseFilename=Instalador_FinanZen
SetupIconFile=favicon.ico
PrivilegesRequired=admin

[Files]
; Ícone
Source: "favicon.ico"; DestDir: "{app}"; Flags: ignoreversion

; Backend
Source: "backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs

; Frontend (Usando o Standalone do Next.js para economizar gigabytes)
Source: "frontend\.next\standalone\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "frontend\.next\static\*"; DestDir: "{app}\frontend\.next\static"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "frontend\public\*"; DestDir: "{app}\frontend\public"; Flags: ignoreversion recursesubdirs createallsubdirs

; Evolution API (Docker)
Source: "evolution\*"; DestDir: "{app}\evolution"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "docker-compose.yml"; DestDir: "{app}"; Flags: ignoreversion

; VBScript de Inicialização Limpa
Source: "FinanZen.vbs"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Atalho na Área de Trabalho
Name: "{autodesktop}\FinanZen"; Filename: "wscript.exe"; Parameters: """{app}\FinanZen.vbs"""; IconFilename: "{app}\favicon.ico"
; Atalho no Menu Iniciar
Name: "{group}\FinanZen"; Filename: "wscript.exe"; Parameters: """{app}\FinanZen.vbs"""; IconFilename: "{app}\favicon.ico"

[Run]
; Inicia o programa automaticamente após a instalação (opcional)
Filename: "wscript.exe"; Parameters: """{app}\FinanZen.vbs"""; Description: "Iniciar o FinanZen agora"; Flags: postinstall nowait

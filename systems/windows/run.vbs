Set WshShell = CreateObject("WScript.Shell")
WshShell.Popup "Iniciando RedeWorth Rich Presence... Aguarde um momento.", 5, "Carregando...", 64
WshShell.Run "cmd /c start /B electron.bat", 0, False

---
layout: post
title: "AV Bypass: Creating WinLogonFix (Undetectable RunasCs)"
date: 2026-01-16
categories: [Red Team, Evasion, C#]
tags: [oscp, evasion, windows, privilege-escalation]
---

`> .\compile_stealth.exe --target WindowsDefender`
<br>
`Analyzing Static Signatures… [BYPASSED]`

In Red Teaming, using unmodified public tools is synonymous with being detected. **Security by obscurity does not work for defense, but it is vital for attack.** Tools like `RunasCs` are instantly detected by static signatures. To evade this, we don't need a 0-day, we just need to **break the signature**.

🔍 **The Philosophy of Evasion**
Modern antiviruses (AV/EDR) look for known patterns. If your binary is named "RunasCs" and contains original text strings, it is a red flag.

> "Code is not malicious because of what it does, but because of how it looks to the defender's eyes."

To transform a detected tool into an invisible threat, we apply three principles:
1.  **Rebranding:** Changing the project identity.
2.  **Obfuscation:** Breaking strings and class names.
3.  **Cleaning:** Compiling without debug metadata.

---

## 🛠️ Phase 1: Camouflage Engineering

We create a new project in Visual Studio. It is vital to select **Console App (.NET Framework)** to ensure compatibility.

![Project selection](/images/1-seleccion-proyecto.png)

We give it a name that goes unnoticed in the system, such as **`WinLogonFix`**, and select Framework 4.7.2.

![Name configuration](/images/2-config-nombre.png)
![Startup fix](/images/4-fix-startup.png)

## 🧬 Phase 2: Code Mutation

We delete the default code and paste the RunasCs source code.

![Pasting the code](/images/6-codigonuevo.png)

To avoid static detection, we use "Find and Replace" to change all references from `RunasCs` to `WinLogonFix`.

![Name replacement](/images/5-renombre.png)

This modifies 97 references, breaking the antivirus's basic signatures.

![Replacement success](/images/7-remplazoexito.png)


## 🚀 Phase 3: Deployment (PoC)

It is the moment of truth. We change the configuration from `Debug` to **Release** to clean the binary of unnecessary debug information.

![Release configuration](/images/8-release.png)

We compile the solution and verify that there are no errors.

![Compilation success](/images/9-compilar.png)

## 4. Proof of Concept (PoC)

To test it, we create a test user on our local machine:

![Creating test user](/images/10-nuevouser.png)

Finally, we execute the binary to launch a console (`cmd.exe`) as that user. As we can see, **Windows Defender does not block it** and we achieve successful execution (whoami).

I launched the attack to execute a whoami as that user:

```powershell

.\WinLogonFix.exe Prueba Password123! "cmd.exe /c whoami"
```
![Final execution](/images/11-ejecucionExito.png)

---
*Happy Hacking!*

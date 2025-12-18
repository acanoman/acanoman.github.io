# Sanetizar shell

Creadas: 7 de diciembre de 2025 10:49

[https://www.notion.so](https://www.notion.so)

### **Secuencia completa para estabilizar la reverse shell**

1. **Dentro de la shell reversa (en el nc / listener):**

script /dev/null -c bash

1. **En tu terminal de Kali:**

stty raw -echo; fg

1. **Ya de nuevo dentro de la shell remota:**

reset
export SHELL=bash TERM=xterm
stty -a                 # (opcional, para ver rows/columns actuales)
stty rows 40 columns 157
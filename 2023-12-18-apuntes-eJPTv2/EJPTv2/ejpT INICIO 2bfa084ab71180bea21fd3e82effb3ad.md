# ejpT INICIO

Creadas: 4 de diciembre de 2025 17:41

![image.png](ejpT%20INICIO/image.png)

primero reconocenmos nuetra ip con: ip a

nmap -sn ip/24 —> ver las maquinas activas.

sudo nmap -sS —min-rate 5000 -p- —open IPs -oN tcp_scan.txt —> escaneo de las ips con los puertos abiertos.

grep '^[0-9]' tcp_scan.txt | cut -d '/' -f1 | sort -u | xargs | tr ' ' ',’ —> Esto pone los puerto preparados para ecanear.

nmap -p135,139,22,25,445,49665,49670,80 -sC -sV 10.0.2.43,45,46,53,55 — open -Pn -oN Full_scan.txt
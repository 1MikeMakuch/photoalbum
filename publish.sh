
set -x
ssh beech "(cd virtuals/mike/httpdocs/photoalbum ; git pull )"
ssh root@beech systemctl restart nodepa

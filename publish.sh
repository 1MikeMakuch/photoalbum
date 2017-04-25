
set -x
cd ~/www/photoalbum
git push --all
ssh beech "(cd virtuals/mike/httpdocs/photoalbum ; git pull )"
ssh root@beech systemctl restart nodepa

# KVM虚拟机

````bash
sudo virt-install -n ubuntu2004 --description "ubuntu2004" --os-type=linux --os-variant=ubuntu20.04 --ram=2048 --vcpus=1 --disk path=/home/sgxadmin/Configuration/ubuntu2004.img,bus=virtio,size=40 --network bridge:wlp3s0 --accelerate --graphics vnc,listen=0.0.0.0,keymap=en-us --cdrom /home/sgxadmin/Configuration/ubuntu-20.04.1-live-server-amd64.iso
````


# -*- mode: ruby -*-
# vi: set ft=ruby :

$script = <<SCRIPT
echo I am provisioning...
date > /etc/vagrant_provisioned_at
SCRIPT

Vagrant.configure("2") do |config|
  config.vm.provision "shell", inline: $script
  config.vm.box = "ubuntu/trusty64"

  config.vm.provider "virtualbox" do |v|
    v.memory = 2048
    v.cpus = 2
  end

  config.vm.provision :shell, :path => "Vagrant-setup/bootstrap.sh"

  # PostgreSQL Server port forwarding
  config.vm.network :forwarded_port, host: 15432, guest: 5432
  config.vm.network :forwarded_port, host: 3030, guest: 3030
end

<?php

namespace App\Service;

use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;

class MqttService
{
    private string $host;
    private int $port;
    private string $user;
    private string $password;

    public function __construct(
        string $mqttHost = 'mosquitto',
        int $mqttPort = 1883,
        string $mqttUser = '',
        string $mqttPassword = '',
    ) {
        $this->host     = $mqttHost;
        $this->port     = $mqttPort;
        $this->user     = $mqttUser;
        $this->password = $mqttPassword;
    }

    /** Publie un payload JSON sur un topic MQTT. */
    public function publish(string $topic, array $payload): void
    {
        try {
            $client = new MqttClient($this->host, $this->port, 'quartierlink-' . uniqid());
            $settings = (new ConnectionSettings)
                ->setConnectTimeout(3)
                ->setSocketTimeout(3);

            // Le broker n'accepte plus les connexions anonymes.
            if ($this->user !== '') {
                $settings = $settings
                    ->setUsername($this->user)
                    ->setPassword($this->password);
            }
            $client->connect($settings, true);
            $client->publish($topic, json_encode($payload), 0);
            $client->disconnect();
        } catch (\Throwable) {
            // Ne pas bloquer l'envoi HTTP si MQTT est indisponible
        }
    }
}

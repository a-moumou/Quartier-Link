<?php

namespace App\Service;

use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;

class MqttService
{
    private string $host;
    private int $port;

    public function __construct(string $mqttHost = '192.168.64.2', int $mqttPort = 1883)
    {
        $this->host = $mqttHost;
        $this->port = $mqttPort;
    }

    /** Publie un payload JSON sur un topic MQTT. */
    public function publish(string $topic, array $payload): void
    {
        try {
            $client = new MqttClient($this->host, $this->port, 'quartierlink-' . uniqid());
            $settings = (new ConnectionSettings)->setConnectTimeout(3)->setSocketTimeout(3);
            $client->connect($settings, true);
            $client->publish($topic, json_encode($payload), 0);
            $client->disconnect();
        } catch (\Throwable) {
            // Ne pas bloquer l'envoi HTTP si MQTT est indisponible
        }
    }
}

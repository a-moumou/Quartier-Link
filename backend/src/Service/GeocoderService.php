<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class GeocoderService
{
    public function __construct(private HttpClientInterface $httpClient) {}

    /** Returns [lat, lon] or null if geocoding fails. */
    public function geocode(string $address): ?array
    {
        try {
            $response = $this->httpClient->request('GET', 'https://nominatim.openstreetmap.org/search', [
                'query' => ['q' => $address, 'format' => 'json', 'limit' => 1],
                'headers' => ['User-Agent' => 'QuartierLink/1.0'],
                'timeout' => 5,
            ]);

            $results = $response->toArray(false);
            if (empty($results)) return null;

            return [(float) $results[0]['lat'], (float) $results[0]['lon']];
        } catch (\Throwable) {
            return null;
        }
    }
}

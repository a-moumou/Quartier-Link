<?php

namespace App\Tests\Unit\Service;

use App\Service\GeocoderService;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

class GeocoderServiceTest extends TestCase
{
    private function makeService(HttpClientInterface $client): GeocoderService
    {
        return new GeocoderService($client);
    }

    // ── Tests nominaux ─────────────────────────────────────────

    public function testGeocodeReturnsLatLonArray(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('toArray')->willReturn([
            ['lat' => '48.8534', 'lon' => '2.3488'],
        ]);

        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturn($response);

        $service = $this->makeService($client);
        $result  = $service->geocode('10 Rue de la Paix, Paris');

        $this->assertIsArray($result);
        $this->assertCount(2, $result);
        $this->assertEqualsWithDelta(48.8534, $result[0], 0.001);
        $this->assertEqualsWithDelta(2.3488,  $result[1], 0.001);
    }

    public function testGeocodeReturnsNullWhenEmptyResults(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('toArray')->willReturn([]);

        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturn($response);

        $service = $this->makeService($client);
        $result  = $service->geocode('adresse inexistante xyz');

        $this->assertNull($result);
    }

    public function testGeocodeReturnsNullOnHttpException(): void
    {
        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willThrowException(new \RuntimeException('timeout'));

        $service = $this->makeService($client);
        $result  = $service->geocode('Paris');

        $this->assertNull($result);
    }

    public function testGeocodeCallsNominatimWithCorrectParameters(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('toArray')->willReturn([
            ['lat' => '48.85', 'lon' => '2.35'],
        ]);

        $client = $this->createMock(HttpClientInterface::class);
        $client->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'https://nominatim.openstreetmap.org/search',
                $this->callback(function (array $options) {
                    return isset($options['query']['q'])
                        && $options['query']['format'] === 'json'
                        && $options['query']['limit'] === 1
                        && isset($options['headers']['User-Agent']);
                })
            )
            ->willReturn($response);

        $service = $this->makeService($client);
        $service->geocode('Paris, France');
    }

    public function testLatLonAreFloats(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('toArray')->willReturn([
            ['lat' => '48.8534', 'lon' => '2.3488'],
        ]);

        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturn($response);

        $result = $this->makeService($client)->geocode('Paris');

        $this->assertIsFloat($result[0]);
        $this->assertIsFloat($result[1]);
    }
}

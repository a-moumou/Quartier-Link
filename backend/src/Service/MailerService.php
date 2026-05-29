<?php

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

class MailerService
{
    private const FROM = 'abdelhadi.mou@gmail.com';
    private const APP  = 'QuartierLink';

    public function __construct(private MailerInterface $mailer) {}

    // ─── Compte ──────────────────────────────────────────────────────────────

    public function sendWelcome(string $to, string $firstName): void
    {
        $this->send(
            $to,
            'Bienvenue sur QuartierLink !',
            $this->html(
                "Bonjour $firstName,",
                'Votre compte a bien été créé. Pour accéder aux quartiers, envoyez un justificatif de domicile depuis votre profil afin que notre équipe valide votre identité.'
            )
        );
    }

    public function sendAccountVerified(string $to, string $firstName): void
    {
        $this->send(
            $to,
            'Votre compte est vérifié',
            $this->html(
                "Bonjour $firstName,",
                'Bonne nouvelle ! Votre compte a été vérifié. Vous pouvez maintenant rejoindre un quartier et participer aux discussions.'
            )
        );
    }

    public function sendAccountRejected(string $to, string $firstName): void
    {
        $this->send(
            $to,
            'Justificatif refusé',
            $this->html(
                "Bonjour $firstName,",
                'Votre justificatif de domicile n\'a pas pu être validé. Veuillez en soumettre un nouveau depuis votre profil (pièce d\'identité, quittance de loyer ou facture récente).'
            )
        );
    }

    // ─── Adhésion quartier ────────────────────────────────────────────────────

    public function sendJoinApproved(string $to, string $firstName, string $quartierName): void
    {
        $this->send(
            $to,
            "Demande acceptée — $quartierName",
            $this->html(
                "Bonjour $firstName,",
                "Votre demande d'adhésion au quartier « $quartierName » a été acceptée. Vous faites maintenant partie de la communauté !"
            )
        );
    }

    public function sendJoinRejected(string $to, string $firstName, string $quartierName): void
    {
        $this->send(
            $to,
            "Demande refusée — $quartierName",
            $this->html(
                "Bonjour $firstName,",
                "Votre demande d'adhésion au quartier « $quartierName » a été refusée par l'administrateur."
            )
        );
    }

    // ─── Quartier ─────────────────────────────────────────────────────────────

    public function sendQuartierApproved(string $to, string $firstName, string $quartierName): void
    {
        $this->send(
            $to,
            "Quartier approuvé — $quartierName",
            $this->html(
                "Bonjour $firstName,",
                "Votre quartier « $quartierName » a été approuvé et est maintenant actif sur QuartierLink. Les habitants de votre zone peuvent désormais vous rejoindre."
            )
        );
    }

    public function sendQuartierRejected(string $to, string $firstName, string $quartierName): void
    {
        $this->send(
            $to,
            "Quartier refusé — $quartierName",
            $this->html(
                "Bonjour $firstName,",
                "Votre demande de création du quartier « $quartierName » a été refusée. Contactez-nous pour plus d'informations."
            )
        );
    }

    // ─── Mot de passe oublié ──────────────────────────────────────────────────

    public function sendPasswordReset(string $to, string $firstName, string $code): void
    {
        $this->send(
            $to,
            'Réinitialisation de votre mot de passe',
            $this->html(
                "Bonjour $firstName,",
                "Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification (valable 15 minutes) :\n\n" .
                "<p style=\"margin:24px 0;font-size:32px;font-weight:700;letter-spacing:10px;color:#1e293b;text-align:center;\">$code</p>" .
                "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
            )
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function send(string $to, string $subject, string $htmlBody): void
    {
        try {
            $email = (new Email())
                ->from(self::FROM)
                ->to($to)
                ->subject('[' . self::APP . '] ' . $subject)
                ->html($htmlBody);

            $this->mailer->send($email);
        } catch (\Throwable) {
            // Ne pas bloquer la réponse HTTP si l'envoi échoue
        }
    }

    private function html(string $greeting, string $body): string
    {
        return <<<HTML
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;">

                <!-- Header -->
                <tr><td style="padding:28px 40px;border-bottom:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#1e293b;">
                    QuartierLink
                  </p>
                </td></tr>

                <!-- Body -->
                <tr><td style="padding:36px 40px;">
                  <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1e293b;">$greeting</p>
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">$body</p>
                </td></tr>

                <!-- Footer -->
                <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;">
                    Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                  </p>
                </td></tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        HTML;
    }
}

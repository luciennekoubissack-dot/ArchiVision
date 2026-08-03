import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
/**
 * Filtre d'exceptions global — garantit un format de réponse d'erreur
 * cohérent sur toute l'API, quelle que soit l'origine de l'erreur
 * (HttpException métier, erreur Prisma, exception inattendue).
 *
 * Ne laisse jamais fuiter de détails internes (stack trace, message Prisma
 * brut) pour les erreurs non prévues : celles-ci sont loguées côté serveur
 * et renvoyées au client sous forme générique (500).
 */
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private resolve;
    private resolvePrismaError;
}
//# sourceMappingURL=http-exception.filter.d.ts.map
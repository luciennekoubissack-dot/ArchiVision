"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
/**
 * Filtre d'exceptions global — garantit un format de réponse d'erreur
 * cohérent sur toute l'API, quelle que soit l'origine de l'erreur
 * (HttpException métier, erreur Prisma, exception inattendue).
 *
 * Ne laisse jamais fuiter de détails internes (stack trace, message Prisma
 * brut) pour les erreurs non prévues : celles-ci sont loguées côté serveur
 * et renvoyées au client sous forme générique (500).
 */
let HttpExceptionFilter = class HttpExceptionFilter {
    logger = new common_1.Logger('ExceptionFilter');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const { status, message, error } = this.resolve(exception);
        const body = {
            statusCode: status,
            message,
            error,
            path: request.url,
            timestamp: new Date().toISOString(),
        };
        if (status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`${request.method} ${request.url} → ${status}`, exception instanceof Error ? exception.stack : undefined);
        }
        response.status(status).json(body);
    }
    resolve(exception) {
        if (exception instanceof common_1.HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'string') {
                return { status: exception.getStatus(), message: response, error: exception.name };
            }
            const { message, error } = response;
            return {
                status: exception.getStatus(),
                message: message ?? exception.message,
                error: error ?? exception.name,
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return this.resolvePrismaError(exception);
        }
        return {
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Erreur interne du serveur',
            error: 'Internal Server Error',
        };
    }
    resolvePrismaError(exception) {
        switch (exception.code) {
            case 'P2002':
                return {
                    status: common_1.HttpStatus.CONFLICT,
                    message: 'Une ressource avec cette valeur unique existe déjà',
                    error: 'Conflict',
                };
            case 'P2025':
                return {
                    status: common_1.HttpStatus.NOT_FOUND,
                    message: 'Ressource introuvable',
                    error: 'Not Found',
                };
            case 'P2003':
                return {
                    status: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Référence invalide vers une ressource liée',
                    error: 'Bad Request',
                };
            default:
                return {
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Erreur interne du serveur',
                    error: 'Internal Server Error',
                };
        }
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map
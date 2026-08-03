export declare const IS_PUBLIC_KEY = "isPublic";
/**
 * Marque un endpoint comme public — bypass du JwtAuthGuard si ce dernier
 * est enregistré globalement.
 *
 * @example
 * @Public()
 * @Post('login')
 * login() { ... }
 */
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
//# sourceMappingURL=public.decorator.d.ts.map
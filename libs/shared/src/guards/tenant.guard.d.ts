import { CanActivate, ExecutionContext } from '@nestjs/common';
import { TenantContextService } from '@archivision/tenant-context';
export declare class TenantGuard implements CanActivate {
    private readonly tenantContext;
    constructor(tenantContext: TenantContextService);
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=tenant.guard.d.ts.map
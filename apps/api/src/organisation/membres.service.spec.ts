import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { MembresService } from './membres.service';

describe('MembresService', () => {
  let service: MembresService;

  const mockMembre = {
    id: 'user-002',
    email: 'collaborateur@k-and-b.local',
    passwordHash: 'hash',
    nom: 'Collaborateur',
    organisationId: 'org-001',
    role: RoleUtilisateur.COLLABORATEUR,
    serviceId: null,
  };

  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MembresService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(MembresService);
  });

  describe('findAll', () => {
    it("liste les membres d'une organisation", async () => {
      prismaMock.user.findMany.mockResolvedValue([mockMembre]);

      const result = await service.findAll('org-001');

      expect(result).toEqual([mockMembre]);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organisationId: 'org-001' } }),
      );
    });
  });

  describe('create', () => {
    it('crée un membre rattaché à l\'organisation', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockMembre);

      const result = await service.create('org-001', {
        email: mockMembre.email,
        password: 'MotDePasse123!',
        nom: mockMembre.nom,
        role: RoleUtilisateur.COLLABORATEUR,
      });

      expect(result).toEqual(mockMembre);
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organisationId: 'org-001', role: RoleUtilisateur.COLLABORATEUR }),
        }),
      );
    });

    it('lève ConflictException si l\'email existe déjà', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockMembre);

      await expect(
        service.create('org-001', {
          email: mockMembre.email,
          password: 'MotDePasse123!',
          nom: 'X',
          role: RoleUtilisateur.COLLABORATEUR,
        }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('lève NotFoundException si le membre appartient à une autre organisation', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockMembre, organisationId: 'org-002' });

      await expect(
        service.update('org-001', mockMembre.id, { role: RoleUtilisateur.ARCHITECTE }),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour le rôle', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockMembre);
      prismaMock.user.update.mockResolvedValue({ ...mockMembre, role: RoleUtilisateur.REPRESENTANT });

      const result = await service.update('org-001', mockMembre.id, { role: RoleUtilisateur.REPRESENTANT });

      expect(result.role).toBe(RoleUtilisateur.REPRESENTANT);
    });
  });

  describe('remove', () => {
    it('supprime un membre non-Architecte', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockMembre);
      prismaMock.user.delete.mockResolvedValue(mockMembre);

      await service.remove('org-001', mockMembre.id);

      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: mockMembre.id } });
    });

    it('lève ConflictException si c\'est le dernier Architecte', async () => {
      const architecte = { ...mockMembre, role: RoleUtilisateur.ARCHITECTE };
      prismaMock.user.findUnique.mockResolvedValue(architecte);
      prismaMock.user.count.mockResolvedValue(1);

      await expect(service.remove('org-001', architecte.id)).rejects.toThrow(ConflictException);
      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });

    it('autorise la suppression d\'un Architecte s\'il en reste un autre', async () => {
      const architecte = { ...mockMembre, role: RoleUtilisateur.ARCHITECTE };
      prismaMock.user.findUnique.mockResolvedValue(architecte);
      prismaMock.user.count.mockResolvedValue(2);
      prismaMock.user.delete.mockResolvedValue(architecte);

      await service.remove('org-001', architecte.id);

      expect(prismaMock.user.delete).toHaveBeenCalled();
    });

    it('lève NotFoundException si le membre est introuvable', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('org-001', 'inconnu')).rejects.toThrow(NotFoundException);
    });
  });
});

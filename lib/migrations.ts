// Database Migration System
export interface Migration {
  version: number;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

export class DatabaseMigrationService {
  private static instance: DatabaseMigrationService;
  private currentVersion = 0;

  private constructor() {}

  static getInstance(): DatabaseMigrationService {
    if (!DatabaseMigrationService.instance) {
      DatabaseMigrationService.instance = new DatabaseMigrationService();
    }
    return DatabaseMigrationService.instance;
  }

  async migrate(migrations: Migration[]): Promise<void> {
    // Sort migrations by version
    migrations.sort((a, b) => a.version - b.version);

    for (const migration of migrations) {
      if (migration.version > this.currentVersion) {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        await migration.up();
        this.currentVersion = migration.version;
      }
    }
  }
}

// Migration definitions
export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Create initial database schema',
    up: async () => {
      // This will be handled by the initial schema creation in db.ts
      console.log('Initial schema created');
    },
  },
  // Add future migrations here
  // {
  //   version: 2,
  //   description: 'Add new feature',
  //   up: async () => {
  //     // Migration logic here
  //   },
  //   down: async () => {
  //     // Rollback logic here
  //   },
  // },
];
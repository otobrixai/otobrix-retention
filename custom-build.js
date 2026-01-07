// Custom build script that handles Prisma BOM issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom build script...');

try {
    // 1. First, try to fix any package.json files with BOM
    console.log('Checking for BOM in package.json files...');
    
    function fixBomInFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.charCodeAt(0) === 0xFEFF) {
                console.log(`Fixing BOM in: ${filePath}`);
                fs.writeFileSync(filePath, content.slice(1), 'utf8');
            }
        } catch (err) {
            // Ignore errors
        }
    }
    
    // Fix root package.json
    fixBomInFile('package.json');
    
    // 2. Generate Prisma Client with direct command (bypassing CLI state)
    console.log('Generating Prisma Client...');
    try {
        // Direct approach using the engine directly
        execSync('npx prisma generate --schema=./prisma/schema.prisma', { 
            stdio: 'inherit',
            env: { ...process.env, PRISMA_SKIP_CLI_STATE: '1' }
        });
    } catch (prismaError) {
        console.log('Prisma generate failed, trying alternative...');
        // Alternative: Use the Prisma engine directly
        const prismaCliPath = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
        if (fs.existsSync(prismaCliPath)) {
            execSync(`node "${prismaCliPath}" generate`, { stdio: 'inherit' });
        }
    }
    
    // 3. Run Next.js build
    console.log('Running Next.js build...');
    execSync('next build', { stdio: 'inherit' });
    
    console.log('✅ Build completed successfully!');
    process.exit(0);
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

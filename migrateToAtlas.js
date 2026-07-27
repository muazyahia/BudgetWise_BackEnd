const { MongoClient } = require('mongodb');

// الروابط
const LOCAL_URI = 'mongodb://localhost:27017/budgetwise';
const REMOTE_URI = 'mongodb+srv://moazyahia2002_db_user:pC4QpxO0dxXfdARn@cluster0.c8kcorf.mongodb.net/budgetwise?retryWrites=true&w=majority';

async function migrateData() {
    console.log('--- بدء عملية نقل البيانات إلى MongoDB Atlas ---');
    const localClient = new MongoClient(LOCAL_URI);
    const remoteClient = new MongoClient(REMOTE_URI);

    try {
        console.log('جاري الاتصال بقاعدة البيانات المحلية...');
        await localClient.connect();
        console.log('تم الاتصال محلياً بنجاح!');

        console.log('جاري الاتصال بقاعدة البيانات السحابية (Atlas)...');
        await remoteClient.connect();
        console.log('تم الاتصال بالسحابة بنجاح!');
        
        const localDb = localClient.db();
        const remoteDb = remoteClient.db();

        // جلب جميع الـ Collections من القاعدة المحلية
        const collections = await localDb.listCollections().toArray();

        for (let collInfo of collections) {
            const collName = collInfo.name;
            console.log(`\n- يتم الآن فحص Collection: ${collName}`);
            
            const docs = await localDb.collection(collName).find({}).toArray();
            
            if (docs.length > 0) {
                console.log(`  > تم العثور على ${docs.length} مستندات، جاري نقلها...`);
                
                // مسح البيانات الموجودة مسبقاً في السحابة لنفس الكولكشن لتجنب التكرار (الأخطاء)
                try {
                    await remoteDb.collection(collName).drop();
                } catch(e) {
                    // تجاهل الخطأ إذا لم تكن الكولكشن موجودة
                }
                
                // إدخال البيانات في السحابة
                await remoteDb.collection(collName).insertMany(docs);
                console.log(`  > [نجاح] تم إدخال البيانات في السحابة بنجاح!`);
            } else {
                console.log(`  > الكولكشن فارغة، تم التخطي.`);
            }
        }
        console.log('\n✅ عملية نقل جميع البيانات تمت بنجاح تام!');
    } catch(err) {
        console.error('\n❌ حدث خطأ أثناء عملية النقل:', err);
    } finally {
        await localClient.close();
        await remoteClient.close();
        process.exit(0);
    }
}

migrateData();

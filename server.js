import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

let prisma;
try {
  prisma = new PrismaClient();
  console.log('Database Client Initialized');
} catch (e) {
  console.error('FAILED to initialize Prisma Client:', e.message);
}

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(process.cwd(), 'dist')));

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: e.message });
  }
});

// Default configuration to seed if database is empty
const defaultData = {
  appTitle: 'بوابة تقييم الفنون البصرية',
  appSubtitle: 'مشروع تشغيل المدارس الثقافية الحكومية',
  grades: [
    { id: 'grade4', name: 'الصف الرابع الابتدائي' },
    { id: 'grade_int1', name: 'الصف الأول متوسط' }
  ],
  subjects: [
    { id: 'drawing_basics', name: 'أساسيات الرسم' },
    { id: 'saudi_arts', name: 'الفنون البصرية السعودية' },
    { id: 'cartoon', name: 'الرسم الكرتوني', grades: ['grade4'] },
    { id: 'handicrafts', name: 'الأشغال اليدوية', grades: ['grade4'] },
    { id: 'character_design', name: 'رسم وتصميم الشخصيات الكرتونية', grades: ['grade_int1'] },
    { id: 'digital_drawing', name: 'الرسم الرقمي', grades: ['grade_int1'] }
  ],
  evalTypeTitles: {
    unit: 'تقييم نهاية الوحدة (20 درجة)',
    periodic: 'التقويم المرحلي (60 درجة)',
    final: 'التقويم الختامي (50 درجة)'
  },
  criteria: {
    unit: [
      { id: 1, text: 'الالتزام بأسلوب النشاط المطلوب', max: 4 },
      { id: 2, text: 'الحضور والمشاركة الفعّالة', max: 4 },
      { id: 3, text: 'الإبداع والتعبير الشخصي', max: 4 },
      { id: 4, text: 'إتمام النشاط في الوقت المحدد', max: 4 },
      { id: 5, text: 'وضوح الخطوط، التناسق بين الأشكال، والدقة في الألوان', max: 4 }
    ],
    periodic: {
      grade4_drawing_basics: [
        { id: 101, text: 'يطبق أسلوب مسك القلم السليم', max: 4 },
        { id: 102, text: 'يميّز بين أنواع الخطوط وتوظيفها بشكل صحيح', max: 4 },
        { id: 103, text: 'يستخدم القبضات المختلفة وفق طبيعة النشاط الفني', max: 4 },
        { id: 104, text: 'يطبق التدرج اللوني من الفاتح إلى الغامق', max: 4 },
        { id: 105, text: 'يطبق التدرج اللوني من الغامق إلى الفاتح', max: 4 },
        { id: 106, text: 'يحافظ على انسجام الألوان في العمل الفني', max: 4 },
        { id: 107, text: 'يلون أشكالًا داخل حدود واضحة', max: 4 },
        { id: 108, text: 'يميّز خصائص الأشكال الهندسية الأساسية', max: 4 },
        { id: 109, text: 'يرسم الدائرة، المربع، المثلث والمستطيل بخط اليد', max: 4 },
        { id: 110, text: 'يحافظ على التوازن بين العناصر المرسومة', max: 4 },
        { id: 111, text: 'يستخدم الأشكال الهندسية لتكوين عناصر أو شخصيات', max: 4 },
        { id: 112, text: 'يلون الأشكال بتدرج لون واحد أو أكثر', max: 4 },
        { id: 113, text: 'يدمج الألوان داخل الشكل بطريقة متناسقة', max: 4 },
        { id: 114, text: 'يحقق انتقال ناعم بين لونين أو أكثر', max: 4 },
        { id: 115, text: 'يطبق عمل فني مستوحى من البيئة أو الهوية السعودية', max: 4 }
      ],
      grade4_saudi_arts: [
        { id: 201, text: 'يتعرف على خصائص الفن التشكيلي السعودي وروّاده', max: 4 },
        { id: 202, text: 'يميّز بين الحرفة والفن التشكيلي من حيث الهدف', max: 4 },
        { id: 203, text: 'يفسّر عناصر العمل الفني ودورها في التعبير البصري', max: 4 },
        { id: 204, text: 'يفسّر العلاقة بين العناصر وكيف تسهم في التوازن', max: 4 },
        { id: 205, text: 'يحلّل أعمالًا فنية سعودية ويستنتج الأسلوب', max: 4 },
        { id: 206, text: 'يقارن بين المدارس الفنية السعودية من حيث الفكرة', max: 4 },
        { id: 207, text: 'يستنتج تأثير البيئة السعودية في الأعمال المحلية', max: 4 },
        { id: 208, text: 'يحلّل أعمالًا من مدارس مختلفة ويقارن بينها', max: 4 },
        { id: 209, text: 'يعبّر عن فكرة من البيئة المحلية بأسلوب متوازن', max: 4 },
        { id: 210, text: 'يبتكر عملًا مستوحى من أحد روّاد الفن في المملكة', max: 4 },
        { id: 211, text: 'ينفّذ لوحة تعبّر عن فهمه لإحدى المدارس الفنية', max: 4 },
        { id: 212, text: 'يوظّف الرموز الوطنية (كالنخلة، الصقر) في عمله', max: 4 },
        { id: 213, text: 'يُظهر إدراكه للمدارس الفنية من خلال اللون والخط', max: 4 },
        { id: 214, text: 'يعبّر عن ذاته بأسلوب معاصر مستوحى من وطنه', max: 4 },
        { id: 215, text: 'يستنتج العلاقة بين الأسلوب والهوية الثقافية', max: 4 }
      ],
      grade4_cartoon: [
        { id: 301, text: 'يتعرف على عالم الكرتون والشخصيات', max: 4 },
        { id: 302, text: 'يفهم الفرق بين الرسوم الكرتونية والواقعية', max: 4 },
        { id: 303, text: 'يميز أنواع الشخصيات (بطل، شرير، مضحك)', max: 4 },
        { id: 304, text: 'يرسم ملامح الوجه الكرتونية بأسلوب مبسط', max: 4 },
        { id: 305, text: 'يوضح التعبير في العينين، الحواجب، والفم', max: 4 },
        { id: 306, text: 'ينوع الأشكال ويربطها بالمشاعر', max: 4 },
        { id: 307, text: 'ينسق الأنف والفم مع باقي الملامح', max: 4 },
        { id: 308, text: 'يستخدم اللون للتعبير عن المشاعر', max: 4 },
        { id: 309, text: 'يرسم نسب الوجه والجسم الكرتوني بطريقة صحيحة', max: 4 },
        { id: 310, text: 'يطبّق الأشكال الهندسية الأساسية في بناء الشخصية', max: 4 },
        { id: 311, text: 'يضيف تعابير أو ملابس لإضفاء الطابع الشخصي', max: 4 },
        { id: 312, text: 'يبتكر شخصية كرتونية تعبّر عن الهوية السعودية', max: 4 },
        { id: 313, text: 'يطبق إظهار الحركة أو الحوار بين الشخصيات', max: 4 },
        { id: 314, text: 'يظهر إبداعًا شخصيًا في الفكرة دون تقليد', max: 4 },
        { id: 315, text: 'ينظّم ملف إنجاز مرتبًا يحتوي على جميع المهام', max: 4 }
      ],
      grade4_handicrafts: [
        { id: 401, text: 'يتعرّف على الأدوات والخامات ويستخدمها بأمان', max: 4 },
        { id: 402, text: 'يطبّق خطوات قصّ الورق وثنيه بدقة', max: 4 },
        { id: 403, text: 'يصنع مجسمات بسيطة باستخدام الورق والفوم', max: 4 },
        { id: 404, text: 'يدمج بين خامات مختلفة لإنتاج شكل متكامل', max: 4 },
        { id: 405, text: 'يظهر توازنًا وتنظيمًا في توزيع العناصر', max: 4 },
        { id: 406, text: 'يتعرّف على خصائص الخامات البيئية والملمس', max: 4 },
        { id: 407, text: 'يبتكر عملاً بسيطاً باستخدام خامات معاد تدويرها', max: 4 },
        { id: 408, text: 'يوظّف مبادئ التصميم في تكوين بصري متوازن', max: 4 },
        { id: 409, text: 'يعبّر عن فكرة بيئية تعكس الوعي بالحفاظ عليها', max: 4 },
        { id: 410, text: 'يستخدم أدوات القص واللصق بدقة ونظافة عالية', max: 4 },
        { id: 411, text: 'يُظهر قدرة على التنظيم أثناء التنفيذ', max: 4 },
        { id: 412, text: 'يشارك بفعالية ويظهر تعاونًا إيجابيًا مع زملائه', max: 4 },
        { id: 413, text: 'يعبّر عن البيئة أو الهوية من خلال الألوان', max: 4 },
        { id: 414, text: 'يُظهر إبداعًا شخصيًا في اختيار الخامات', max: 4 },
        { id: 415, text: 'ينظم ملف إنجاز شامل يوثق مراحل العمل', max: 4 }
      ],
      grade_int1_drawing_basics: [
        { id: 501, text: 'يطبق طرق مسك القلم والتحكم في ضغطه', max: 4 },
        { id: 502, text: 'يميّز بين أنواع الخطوط وتوظيفها بشكل صحيح', max: 4 },
        { id: 503, text: 'ينفذ خطوط بدرجات ضغط مختلفة لإظهار التباين', max: 4 },
        { id: 504, text: 'يستخدم القبضات المختلفة وفق طبيعة النشاط', max: 4 },
        { id: 505, text: 'يطبق المزج اللوني بالألوان المائية بمهارة', max: 4 },
        { id: 506, text: 'يطبق التدرّج اللوني من الغامق إلى الفاتح', max: 4 },
        { id: 507, text: 'يوظف الخطوط والألوان في عمل يعبر عن فكرة', max: 4 },
        { id: 508, text: 'يشارك الإيجابية والتعاون مع الزملاء', max: 4 },
        { id: 509, text: 'يحافظ على نظافة الورقة ودقة التنفيذ', max: 4 },
        { id: 510, text: 'ينظم محتوى ملف الإنجاز لتوثيق المراحل', max: 4 },
        { id: 511, text: 'يميز خصائص الأشكال الهندسية ودقة رسمها', max: 4 },
        { id: 512, text: 'يطبق مبادئ التوازن والتكرار في التصميم', max: 4 },
        { id: 513, text: 'يستخدم التدرج اللوني داخل الشكل لإظهار العمق', max: 4 },
        { id: 514, text: 'يدمج أكثر من شكل هندسي في تكوين متكامل', max: 4 },
        { id: 515, text: 'يطبق عمل فني مستوحى من الهوية السعودية', max: 4 }
      ],
      grade_int1_character_design: [
        { id: 601, text: 'يعرّف مفهوم الرسم الكرتوني والوجه الواقعي', max: 4 },
        { id: 602, text: 'يرسم ملامح الوجه الكرتونية بأسلوب مبسط', max: 4 },
        { id: 603, text: 'يطبّق مبدأ المبالغة لإظهار الانفعالات', max: 4 },
        { id: 604, text: 'يستخدم اللون بشكل تعبيري مناسب للحالة', max: 4 },
        { id: 605, text: 'يرسم نسب الوجه والجسم بطريقة متناسبة', max: 4 },
        { id: 606, text: 'يطبّق الأشكال الهندسية في بناء الشخصية', max: 4 },
        { id: 607, text: 'يظهر التوازن البصري بين أجزاء الشخصية', max: 4 },
        { id: 608, text: 'يستخدم الخط البنائي لتوضيح الحركة', max: 4 },
        { id: 609, text: 'يبتكر شخصية كرتونية تعبّر عن الهوية السعودية', max: 4 },
        { id: 610, text: 'يوظّف الألوان بتناغم جمالي داخل الشخصية', max: 4 },
        { id: 611, text: 'يعرض عمله الفني بترتيب ونظافة ووضوح', max: 4 },
        { id: 612, text: 'يشارك بإيجابية في النقاشات الصفية', max: 4 },
        { id: 613, text: 'يظهر إبداعًا في الفكرة دون تقليد مباشر', max: 4 },
        { id: 614, text: 'يوظّف الرموز لربط العمل بالبيئة المحلية', max: 4 },
        { id: 615, text: 'ينظّم ملف إنجاز مرتبًا لجميع المهام', max: 4 }
      ],
      grade_int1_digital_drawing: [
        { id: 701, text: 'يميّز بين الرسم الرقمي والرسم التقليدي', max: 4 },
        { id: 702, text: 'يتعرف على الأدوات الأساسية في Procreate', max: 4 },
        { id: 703, text: 'يستخدم الأدوات الرقمية لإنتاج خطوط متناسقة', max: 4 },
        { id: 704, text: 'يوظف مفهوم الطبقات في تنظيم العمل', max: 4 },
        { id: 705, text: 'يطبق مهارة التدرجات اللونية لإظهار العمق', max: 4 },
        { id: 706, text: 'يختار أنواع الفرش الرقمية المناسبة للملمس', max: 4 },
        { id: 707, text: 'يوظف أنماط المزج في تحسين التفاعل اللوني', max: 4 },
        { id: 708, text: 'يستخدم الأقنعة والفلاتر لتحسين جودة العمل', max: 4 },
        { id: 709, text: 'يطبق تقنيات الإضاءة بما يعزز الإحساس بالحجم', max: 4 },
        { id: 710, text: 'يظهر دقة في تنسيق الطبقات وتوزيع الإضاءة', max: 4 },
        { id: 711, text: 'يدمج بين الأسلوب الواقعي والتجريدي رقمياً', max: 4 },
        { id: 712, text: 'يعبر عن فكرة فنية ترتبط بالبيئة السعودية', max: 4 },
        { id: 713, text: 'يوظف الألوان الرقمية بإبداع دون مبالغة', max: 4 },
        { id: 714, text: 'يُظهر مهارة في حفظ العمل وتنسيقه للعرض', max: 4 },
        { id: 715, text: 'ينظم ملف إنجاز رقمي يوثق مراحل العمل', max: 4 }
      ]
    },
    final: {
      grade4_drawing_basics: [
        { id: 1001, text: 'يتقن التحكم بالقلم ورسم الخطوط بدقة', max: 6 },
        { id: 1002, text: 'يطبّق تقنيات التلوين والتظليل لإبراز العمق', max: 6 },
        { id: 1003, text: 'يرسم الأشكال الهندسية في تكوينات فنية', max: 6 },
        { id: 1004, text: 'يبتكر أفكارًا فنية أصلية وإبداع شخصي', max: 4 },
        { id: 1005, text: 'يعبّر بصريًا عن الأفكار والمشاعر', max: 5 },
        { id: 1006, text: 'ينظّم العناصر داخل العمل بتوازن وجاذبية', max: 4 },
        { id: 1007, text: 'يلتزم بمفاهيم الفن كالنسب والتناسب', max: 6 },
        { id: 1008, text: 'يحافظ على نظافة العمل ويحترم الإطار', max: 6 },
        { id: 1009, text: 'ينجز مشروعًا نهائيًا مستوحى من الهوية', max: 7 }
      ],
      grade4_saudi_arts: [
        { id: 1101, text: 'يعرف المفاهيم والعناصر الأساسية للفنون', max: 9 },
        { id: 1102, text: 'يميّز بين أنواع الفنون ومدارسها السعودية', max: 7 },
        { id: 1103, text: 'يطبّق عناصر الفن في أعماله الخاصة', max: 7 },
        { id: 1104, text: 'يعبّر عن فكرة أو مشهد بأسلوب مبدع', max: 7 },
        { id: 1105, text: 'يستخدم رموزًا من التراث السعودي', max: 5 },
        { id: 1106, text: 'ينفّذ عملًا فنيًا متقنًا من حيث التنظيم', max: 5 },
        { id: 1107, text: 'يشرح فكرته الفنية ويشارك في عرضها', max: 4 },
        { id: 1108, text: 'يشارك بفاعلية في الأنشطة الفنية', max: 4 }
      ],
      grade4_cartoon: [
        { id: 1201, text: 'يرسم ملامح الوجه الكرتوني بدقة وبساطة', max: 6 },
        { id: 1202, text: 'يعبّر عن المشاعر من خلال ملامح الشخصية', max: 6 },
        { id: 1203, text: 'يصمم شخصيات كرتونية مبتكرة وجذابة', max: 6 },
        { id: 1204, text: 'يدمج الشخصيات مع الخلفيات بشكل متناسق', max: 4 },
        { id: 1205, text: 'يوظف الألوان بطريقة جذابة ومتناسقة', max: 4 },
        { id: 1206, text: 'يبرز الحركة ووضعيات الشخصيات بوضوح', max: 5 },
        { id: 1207, text: 'يحافظ على تناسق المشهد وتوزيع العناصر', max: 4 },
        { id: 1208, text: 'يبتكر أفكاراً قصصية للمشاهد الكرتونية', max: 4 },
        { id: 1209, text: 'يشرح شخصيته الكرتونية بوضوح وثقة', max: 5 }
      ],
      grade4_handicrafts: [
        { id: 1301, text: 'يستخدم الأدوات والخامات بأمان وتنظيم', max: 6 },
        { id: 1302, text: 'يطبّق مهارات القص والطي واللصق بدقة', max: 6 },
        { id: 1303, text: 'يبتكر مجسمات من خامات متنوعة من البيئة', max: 6 },
        { id: 1304, text: 'يوظّف مبادئ التوازن في تكوين متناسق', max: 4 },
        { id: 1305, text: 'يطبّق الزخارف والنقوش بإتقان عالي', max: 4 },
        { id: 1306, text: 'يستخدم تقنيات الكولاج للتعبير الإبداعي', max: 5 },
        { id: 1307, text: 'يعبّر عن الهوية السعودية بأسلوب مبتكر', max: 4 },
        { id: 1308, text: 'يُظهر التزامًا بالعمل الجماعي والنظافة', max: 4 },
        { id: 1309, text: 'يوثق أعماله داخل ملف الإنجاز بوضوح', max: 5 }
      ],
      grade_int1_digital_drawing: [
        { id: 1401, text: 'يتقن استخدام أدوات برنامج Procreate', max: 7 },
        { id: 1402, text: 'ينظم العمل باستخدام الطبقات بكفاءة عالية', max: 7 },
        { id: 1403, text: 'يطبق تقنيات التلوين والتظليل الرقمي', max: 7 },
        { id: 1404, text: 'يصمم شخصيات أو عناصر رقمية مبتكرة', max: 5 },
        { id: 1405, text: 'يوظف المؤثرات الخاصة لزيادة جاذبية العمل', max: 5 },
        { id: 1406, text: 'يعبر عن الحركة والعمق باستخدام الظل', max: 5 },
        { id: 1407, text: 'يدمج الرسم اليدوي مع الصور بمهارة', max: 4 },
        { id: 1408, text: 'يطبق تقنيات التلوين الرقمي بوضوح ودقة', max: 5 },
        { id: 1409, text: 'ينجز مشروعاً نهائياً مستوحى من البيئة', max: 5 }
      ]
    }
  }
};

// Seeding function
async function seedDefaultConfig() {
  try {
    const configRow = await prisma.systemConfig.findFirst();
    if (!configRow) {
      await prisma.systemConfig.create({
        data: {
          config: JSON.stringify(defaultData)
        }
      });
      console.log('Default system configuration seeded.');
    } else {
      await prisma.systemConfig.update({
        where: { id: configRow.id },
        data: { config: JSON.stringify(defaultData) }
      });
      console.log('System configuration updated with new assessment criteria.');
    }
  } catch (error) {
    console.error('Error seeding config:', error);
  }
}

seedDefaultConfig().catch(console.error);

// Routes
app.get('/api/config', async (req, res) => {
  try {
    const configRow = await prisma.systemConfig.findFirst();
    if (configRow) {
      res.json(JSON.parse(configRow.config));
    } else {
      res.json(defaultData);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body.config;
    if (!newConfig) return res.status(400).json({ error: 'Missing config' });
    
    const configRow = await prisma.systemConfig.findFirst();
    if (configRow) {
      await prisma.systemConfig.update({
        where: { id: configRow.id },
        data: { config: JSON.stringify(newConfig) }
      });
    } else {
      await prisma.systemConfig.create({
        data: { config: JSON.stringify(newConfig) }
      });
    }
    res.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { evaluations: true }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, gradeId } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing student name' });
    const student = await prisma.student.create({ data: { name, gradeId } });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.evaluation.deleteMany({ where: { studentId: id } });
    await prisma.student.delete({ where: { id } });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/evaluations', async (req, res) => {
  try {
    const { id, student_id, grade_id, subject_id, evaluation_type, evaluation_date, scores } = req.body;
    
    if (!student_id || !grade_id || !subject_id || !evaluation_type || !evaluation_date || !scores) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let evaluation;
    if (id) {
      evaluation = await prisma.evaluation.update({
        where: { id: parseInt(id) },
        data: {
          studentId: parseInt(student_id),
          gradeId: grade_id,
          subjectId: subject_id,
          evaluationType: evaluation_type,
          evaluationDate: evaluation_date,
          scores: JSON.stringify(scores)
        }
      });
    } else {
      evaluation = await prisma.evaluation.create({
        data: {
          studentId: parseInt(student_id),
          gradeId: grade_id,
          subjectId: subject_id,
          evaluationType: evaluation_type,
          evaluationDate: evaluation_date,
          scores: JSON.stringify(scores)
        }
      });
    }
    
    res.json({ message: 'تم حفظ التقييم بنجاح', evaluation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/evaluations', async (req, res) => {
  try {
    const { student_id, grade_id, subject_id, evaluation_type } = req.query;
    
    if (!student_id || !grade_id || !subject_id || !evaluation_type) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: {
        studentId: parseInt(student_id),
        gradeId: grade_id,
        subjectId: subject_id,
        evaluationType: evaluation_type
      },
      orderBy: {
        id: 'desc'
      }
    });
    
    const parsedEvaluations = evaluations.map(e => ({
      ...e,
      scores: JSON.parse(e.scores)
    }));
    
    res.json(parsedEvaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/evaluations/batch', async (req, res) => {
  try {
    const { student_ids, grade_id, subject_id, evaluation_type } = req.query;
    if (!student_ids || !grade_id || !subject_id || !evaluation_type) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    const ids = String(student_ids).split(',').map(id => parseInt(id.trim())).filter(Boolean);
    const results = await Promise.all(ids.map(async (sid) => {
      const student = await prisma.student.findUnique({ where: { id: sid } });
      const evals = await prisma.evaluation.findMany({
        where: { studentId: sid, gradeId: grade_id, subjectId: subject_id, evaluationType: evaluation_type },
        orderBy: { id: 'desc' },
        take: 1
      });
      if (!student) return null;
      const ev = evals[0] || null;
      return { student, evaluation: ev ? { ...ev, scores: JSON.parse(ev.scores) } : null };
    }));
    res.json(results.filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('*', (req, res) => {
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Frontend files not found.');
    }
  });
});

async function initializeConfig() {
  try {
    const configRow = await prisma.systemConfig.findFirst();
    if (!configRow) {
      await prisma.systemConfig.create({
        data: { config: JSON.stringify(defaultData) }
      });
      console.log('System configuration initialized with default data.');
    } else {
      await prisma.systemConfig.update({
        where: { id: configRow.id },
        data: { config: JSON.stringify(defaultData) }
      });
      console.log('System configuration FORCE UPDATED with new assessment criteria.');
    }
  } catch (error) {
    console.error('Failed to initialize configuration:', error);
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  initializeConfig();
});

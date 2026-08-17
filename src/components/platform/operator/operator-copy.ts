export type OperatorLocale = 'en' | 'ar';

const copy = {
  en: {
    title: 'Wahb Operator',
    description:
      'Investigate current CMS evidence, review safe actions, and monitor verified outcomes.',
    newCase: 'New case',
    cases: 'Cases',
    recent: 'Recent',
    pinned: 'Pinned',
    archived: 'Archived',
    searchCases: 'Search cases',
    noCases: 'Your investigations will appear here.',
    shiftBriefing: 'Shift briefing',
    context: 'Attached context',
    refreshed: 'Refreshed',
    ask: 'Ask',
    investigate: 'Investigate',
    compare: 'Compare',
    recommend: 'Recommend',
    resolve: 'Resolve',
    placeholder:
      'Ask what is happening, why it matters, or what is safe to do.',
    send: 'Send question',
    active: 'Active tasks',
    approvals: 'Needs approval',
    failures: 'Failed',
    controls: 'Controls enabled',
    evidence: 'Evidence',
    tasks: 'Tasks',
    plan: 'Plan',
    governance: 'Governance',
    details: 'Details',
    verified: 'Verified',
    working: 'Working',
    stale: 'Stale',
    unavailable: 'Unavailable',
    current: 'Current',
    confirmedFacts: 'Confirmed facts',
    interpretation: 'Interpretation',
    unknowns: 'Uncertainties',
    recommendations: 'Recommendations',
    degraded: 'Degraded result',
    safeActions: 'Eligible actions',
    manualAction: 'Open native workflow',
    reviewPlan: 'Review plan',
    noActions: 'No safe action is currently admitted for this evidence.',
    routine: 'Routine',
    highImpact: 'High impact',
    target: 'Target',
    affected: 'Affected domains',
    rollback: 'Rollback',
    cancellation: 'Cancellation',
    contingencies: 'Contingencies',
    approve: 'Approve plan',
    approveHigh: 'Approve high-impact plan',
    typePhrase: 'Type the exact approval phrase',
    cancel: 'Cancel',
    cancelPlan: 'Cancel plan',
    cancelTask: 'Cancel task',
    freshPlan: 'Prepare fresh plan',
    stalePlan: 'This preview is stale because approval preconditions changed.',
    before: 'Before',
    after: 'After',
    proof: 'Verified proof',
    openRecord: 'Open source record',
    observed: 'Observed',
    expires: 'Expires',
    authority: 'Authority',
    readDisabled:
      'CMS has disabled Operator reads. History remains visible, but new investigations are unavailable.',
    llmDisabled:
      'LLM interpretation is disabled. Deterministic evidence remains available.',
    executionDisabled:
      'Execution is disabled. Read workflows remain available.',
    schedulesDisabled: 'Schedules are disabled.',
    retry: 'Retry',
    loading: 'Loading…',
    emptyEvidence:
      'Complete an investigation to inspect its authorized evidence.',
    emptyTasks: 'No tasks match this filter.',
    emptyPlan: 'Select an eligible action to prepare a signed plan.',
    deleteCase: 'Delete conversation',
    deleteTitle: 'Delete this conversation?',
    deleteDescription:
      'Conversation messages will be removed. Immutable plan approvals, execution events, and verified effects remain in the audit ledger.',
    deleteConfirm: 'Delete conversation',
    pin: 'Pin case',
    unpin: 'Unpin case',
    archive: 'Archive case',
    restore: 'Restore case',
    locale: 'Language',
    inspector: 'Inspector',
    openCases: 'Open cases',
    openInspector: 'Open inspector',
    noBriefing: 'No priority evidence is available for this context.',
    questionSaved: 'The question and result are stored in this case.',
    closeOperator: 'Close Operator',
    openFullCase: 'Open full case',
    eventsRecorded: 'events recorded',
    groups: {
      active: 'Active',
      needs_approval: 'Needs approval',
      failed: 'Failed',
      completed: 'Completed',
    },
    kinds: {
      all: 'All work',
      investigation: 'Investigations',
      plan: 'Plans',
      schedule: 'Schedules',
      schedule_run: 'Schedule runs',
    },
  },
  ar: {
    title: 'مشغّل وهب',
    description:
      'حقّق في أدلة CMS الحالية وراجع الإجراءات الآمنة وتابع النتائج المتحققة.',
    newCase: 'حالة جديدة',
    cases: 'الحالات',
    recent: 'الحديثة',
    pinned: 'المثبتة',
    archived: 'المؤرشفة',
    searchCases: 'ابحث في الحالات',
    noCases: 'ستظهر تحقيقاتك هنا.',
    shiftBriefing: 'إحاطة الوردية',
    context: 'السياق المرفق',
    refreshed: 'تم التحديث',
    ask: 'اسأل',
    investigate: 'حقّق',
    compare: 'قارن',
    recommend: 'أوصِ',
    resolve: 'حلّ',
    placeholder: 'اسأل ما الذي يحدث، ولماذا يهم، أو ما الإجراء الآمن.',
    send: 'إرسال السؤال',
    active: 'المهام النشطة',
    approvals: 'تحتاج موافقة',
    failures: 'فشلت',
    controls: 'عناصر التحكم المفعلة',
    evidence: 'الأدلة',
    tasks: 'المهام',
    plan: 'الخطة',
    governance: 'الحوكمة',
    details: 'التفاصيل',
    verified: 'متحقق',
    working: 'قيد العمل',
    stale: 'قديم',
    unavailable: 'غير متاح',
    current: 'حالي',
    confirmedFacts: 'حقائق مؤكدة',
    interpretation: 'التفسير',
    unknowns: 'نقاط غير مؤكدة',
    recommendations: 'التوصيات',
    degraded: 'نتيجة محدودة',
    safeActions: 'الإجراءات المؤهلة',
    manualAction: 'فتح سير العمل الأصلي',
    reviewPlan: 'مراجعة الخطة',
    noActions: 'لا يوجد إجراء آمن مقبول حالياً لهذه الأدلة.',
    routine: 'اعتيادي',
    highImpact: 'عالي التأثير',
    target: 'الهدف',
    affected: 'المجالات المتأثرة',
    rollback: 'التراجع',
    cancellation: 'الإلغاء',
    contingencies: 'خطط الطوارئ',
    approve: 'الموافقة على الخطة',
    approveHigh: 'الموافقة على الخطة عالية التأثير',
    typePhrase: 'اكتب عبارة الموافقة المطابقة',
    cancel: 'إلغاء',
    cancelPlan: 'إلغاء الخطة',
    cancelTask: 'إلغاء المهمة',
    freshPlan: 'إعداد خطة حديثة',
    stalePlan: 'أصبحت هذه المعاينة قديمة لأن شروط الموافقة تغيرت.',
    before: 'قبل',
    after: 'بعد',
    proof: 'إثبات التحقق',
    openRecord: 'فتح السجل المصدر',
    observed: 'رُصد',
    expires: 'ينتهي',
    authority: 'المرجعية',
    readDisabled:
      'عطّل CMS قراءات المشغّل. يبقى السجل مرئياً لكن لا يمكن بدء تحقيق جديد.',
    llmDisabled: 'تم تعطيل تفسير النموذج. تظل الأدلة الحتمية متاحة.',
    executionDisabled: 'تم تعطيل التنفيذ. تظل مهام القراءة متاحة.',
    schedulesDisabled: 'تم تعطيل الجداول.',
    retry: 'إعادة المحاولة',
    loading: 'جارٍ التحميل…',
    emptyEvidence: 'أكمل تحقيقاً لفحص أدلته المصرح بها.',
    emptyTasks: 'لا توجد مهام تطابق هذا المرشح.',
    emptyPlan: 'اختر إجراءً مؤهلاً لإعداد خطة موقعة.',
    deleteCase: 'حذف المحادثة',
    deleteTitle: 'حذف هذه المحادثة؟',
    deleteDescription:
      'ستُحذف رسائل المحادثة. تبقى الموافقات وأحداث التنفيذ والنتائج المتحققة في سجل التدقيق.',
    deleteConfirm: 'حذف المحادثة',
    pin: 'تثبيت الحالة',
    unpin: 'إلغاء تثبيت الحالة',
    archive: 'أرشفة الحالة',
    restore: 'استعادة الحالة',
    locale: 'اللغة',
    inspector: 'الفاحص',
    openCases: 'فتح الحالات',
    openInspector: 'فتح الفاحص',
    noBriefing: 'لا توجد أدلة ذات أولوية لهذا السياق.',
    questionSaved: 'يُحفظ السؤال والنتيجة في هذه الحالة.',
    closeOperator: 'إغلاق المشغّل',
    openFullCase: 'فتح الحالة الكاملة',
    eventsRecorded: 'أحداث مسجلة',
    groups: {
      active: 'نشطة',
      needs_approval: 'تحتاج موافقة',
      failed: 'فشلت',
      completed: 'مكتملة',
    },
    kinds: {
      all: 'كل العمل',
      investigation: 'التحقيقات',
      plan: 'الخطط',
      schedule: 'الجداول',
      schedule_run: 'تشغيلات الجداول',
    },
  },
} as const;

export function operatorCopy(locale: OperatorLocale) {
  return copy[locale];
}

const actionLabels: Record<string, [string, string]> = {
  'operator.action.refresh_snapshot': [
    'Refresh feed snapshot',
    'تحديث لقطة الخلاصة',
  ],
  'operator.action.run_source': ['Run source once', 'تشغيل المصدر مرة'],
  'operator.action.run_media_source': [
    'Run media source once',
    'تشغيل مصدر الوسائط مرة',
  ],
  'operator.action.suppress_feed_integrity_episode': [
    'Suppress integrity episode for one hour',
    'تعليق حادثة سلامة الخلاصة لساعة',
  ],
  'operator.action.revoke_feed_integrity_suppression': [
    'Revoke integrity suppression',
    'إلغاء تعليق سلامة الخلاصة',
  ],
  'operator.action.suppress_experience_incident': [
    'Suppress experience incident for one hour',
    'تعليق حادثة تجربة المستخدم لساعة',
  ],
  'operator.action.revoke_experience_suppression': [
    'Revoke experience suppression',
    'إلغاء تعليق تجربة المستخدم',
  ],
  'operator.action.media_circulation_supply_disable_evaluator': [
    'Disable supply evaluator',
    'تعطيل مقيّم إمداد الوسائط',
  ],
};

export function actionLabel(
  key: string,
  locale: OperatorLocale
): string | undefined {
  const exact = actionLabels[key];
  if (exact) return exact[locale === 'ar' ? 1 : 0];
  if (key.startsWith('operator.manual.')) {
    const action = key.split('.').at(-1)?.replaceAll('_', ' ');
    return locale === 'ar'
      ? 'سير عمل يدوي'
      : `Manual workflow: ${action ?? ''}`;
  }
  if (
    [
      'operator.action.source_run_',
      'operator.action.pipeline_',
      'operator.action.artifact_',
      'operator.action.atomization_',
      'operator.action.feed_generation_',
      'operator.action.media_circulation_supply_',
    ].some((prefix) => key.startsWith(prefix))
  )
    return locale === 'ar'
      ? 'إجراء استرداد إمداد الوسائط'
      : 'Recover media supply handoff';
  if (key.startsWith('operator.action.operator_'))
    return locale === 'ar'
      ? 'تغيير حوكمة المشغّل'
      : 'Change Operator governance';
  if (
    key === 'operator.action.share_create' ||
    key === 'operator.action.share_revoke'
  )
    return locale === 'ar'
      ? 'تغيير مشاركة التحقيق'
      : 'Change investigation sharing';
  if (
    /^operator\.action\.[a-z_]+_pause_24h$/.test(key) ||
    key === 'operator.action.embeddings_pause_campaigns_24h'
  )
    return locale === 'ar'
      ? 'إيقاف المجال لمدة 24 ساعة'
      : 'Pause domain for 24 hours';
  if (/^operator\.action\.(sources|media_sources)_(pause|resume)$/.test(key))
    return locale === 'ar' ? 'تغيير حالة المصدر' : 'Change source state';
  return undefined;
}

export function lifecycleLabel(state: string, locale: OperatorLocale) {
  const en: Record<string, string> = {
    accepted: 'Accepted',
    backgrounded: 'Queued for investigation',
    running: 'Running',
    context_collecting: 'Collecting evidence',
    completed: 'Completed',
    done: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    awaiting_approval: 'Needs approval',
    queued: 'Queued',
    claimed: 'Claimed',
    authorizing: 'Authorizing',
    verifying: 'Verifying',
    succeeded: 'Succeeded',
    blocked: 'Blocked',
    active: 'Active',
    paused: 'Paused',
  };
  const ar: Record<string, string> = {
    accepted: 'مقبول',
    backgrounded: 'بانتظار التحقيق',
    running: 'قيد التنفيذ',
    context_collecting: 'يجمع الأدلة',
    completed: 'مكتمل',
    done: 'مكتمل',
    failed: 'فشل',
    cancelled: 'أُلغي',
    awaiting_approval: 'يحتاج موافقة',
    queued: 'في الانتظار',
    claimed: 'تم الاستلام',
    authorizing: 'جارٍ التحقق من الصلاحية',
    verifying: 'قيد التحقق',
    succeeded: 'نجح',
    blocked: 'محظور',
    active: 'نشط',
    paused: 'متوقف',
  };
  return (
    (locale === 'ar' ? ar : en)[state] ??
    (locale === 'ar' ? 'حالة غير معروفة' : 'Unknown state')
  );
}

import { EmailTemplate, EmailDraft } from '../types';
import { format, addDays } from 'date-fns';

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    aging_range: '0-30',
    subject: 'Напоминание об оплате счета {{doc_id}}',
    body: `Здравствуйте, {{name}}!

Напоминаем, что по счёту {{doc_id}} от {{doc_date}} на сумму {{amount}} ₽ срок оплаты — {{due_date}}. 

Будем признательны за оплату в ближайшие дни. Если уже оплатили — спасибо, пришлите, пожалуйста, подтверждение.

С уважением,
Финансовый отдел`
  },
  {
    aging_range: '31-60',
    subject: 'Просрочка по счету {{doc_id}} - требуется оплата',
    body: `Здравствуйте, {{name}}.

По счёту {{doc_id}} от {{doc_date}} ({{amount}} ₽) просрочка {{days_overdue}} дней. 

Просим оплатить до {{new_due}} или ответить, если требуется рассрочка. Готовы обсудить график.

С уважением,
Финансовый отдел`
  },
  {
    aging_range: '61-90',
    subject: 'ВАЖНО: Просрочка по счету {{doc_id}} - {{days_overdue}} дней',
    body: `Добрый день, {{name}}.

По счёту {{doc_id}} от {{doc_date}} ({{amount}} ₽) просрочка {{days_overdue}} дней. 

В случае отсутствия оплаты до {{new_due}} будем вынуждены инициировать претензионную работу. 

Просим связаться сегодня для урегулирования задолженности.

С уважением,
Финансовый отдел`
  },
  {
    aging_range: '90+',
    subject: 'КРИТИЧНО: Задолженность по счету {{doc_id}} - {{days_overdue}} дней',
    body: `Добрый день, {{name}}.

По счёту {{doc_id}} от {{doc_date}} ({{amount}} ₽) просрочка составляет {{days_overdue}} дней. 

Это финальное уведомление перед передачей дела в претензионно-исковой отдел.

Просим погасить задолженность до {{new_due}} или немедленно связаться для урегулирования вопроса.

С уважением,
Финансовый отдел`
  }
];

export const generateEmailDraft = (
  counterpartyName: string,
  docId: string,
  docDate: string,
  amount: number,
  dueDate: string,
  daysOverdue: number
): EmailDraft => {
  let template: EmailTemplate;
  
  if (daysOverdue <= 30) {
    template = EMAIL_TEMPLATES[0];
  } else if (daysOverdue <= 60) {
    template = EMAIL_TEMPLATES[1];
  } else if (daysOverdue <= 90) {
    template = EMAIL_TEMPLATES[2];
  } else {
    template = EMAIL_TEMPLATES[3];
  }

  // Новая дата оплаты (через 7 дней)
  const newDueDate = format(addDays(new Date(), 7), 'dd.MM.yyyy');
  
  // Форматирование дат
  const formattedDocDate = format(new Date(docDate), 'dd.MM.yyyy');
  const formattedDueDate = format(new Date(dueDate), 'dd.MM.yyyy');
  const formattedAmount = amount.toLocaleString('ru-RU');

  // Замена переменных в шаблоне
  const replacements: { [key: string]: string } = {
    '{{name}}': counterpartyName,
    '{{doc_id}}': docId,
    '{{doc_date}}': formattedDocDate,
    '{{amount}}': formattedAmount,
    '{{due_date}}': formattedDueDate,
    '{{days_overdue}}': daysOverdue.toString(),
    '{{new_due}}': newDueDate
  };

  let subject = template.subject;
  let body = template.body;

  Object.entries(replacements).forEach(([placeholder, value]) => {
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    body = body.replace(new RegExp(placeholder, 'g'), value);
  });

  return {
    to: counterpartyName,
    subject,
    body,
    doc_id: docId,
    amount,
    days_overdue: daysOverdue
  };
};

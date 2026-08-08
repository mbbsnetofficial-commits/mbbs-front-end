import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CseCountryQuestion, Question, QuestionOption, QuestionOptionItem } from '../../models/question.model';

@Component({
  selector: 'app-cse-question-renderer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './question-renderer.html',
  styleUrl: './question-renderer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionRenderer {
  readonly question = input.required<CseCountryQuestion | Question>();
  readonly currentAnswer = input<any>(null);
  readonly answerChange = output<any>();

  protected getQuestionTitle(): string {
    const q = this.question();
    return (q as CseCountryQuestion).question || q.title || (q as CseCountryQuestion).question_text || '';
  }

  protected getOptions(): (QuestionOption | QuestionOptionItem | string)[] {
    return this.question().options || [];
  }

  protected getOptionLabel(opt: any): string {
    if (opt === null || opt === undefined) return '';
    if (typeof opt === 'string' || typeof opt === 'number' || typeof opt === 'boolean') return String(opt);
    return String(opt.label || opt.name || opt.text || opt.title || opt.value || '');
  }

  protected getOptionValue(opt: any): any {
    if (opt === null || opt === undefined) return '';
    if (typeof opt === 'string' || typeof opt === 'number' || typeof opt === 'boolean') return opt;
    if (opt.value !== undefined) return opt.value;
    if (opt.id !== undefined) return opt.id;
    if (opt.label !== undefined) return opt.label;
    if (opt.text !== undefined) return opt.text;
    return String(opt);
  }

  protected getOptionDesc(opt: any): string | undefined {
    return typeof opt === 'object' && opt ? opt.description : undefined;
  }

  protected getOptionBadge(opt: any): string | undefined {
    return typeof opt === 'object' && opt ? opt.badge : undefined;
  }

  protected getValidationMin(): number | null {
    const q = this.question() as CseCountryQuestion;
    return q.validation?.min ?? null;
  }

  protected getValidationMax(): number | null {
    const q = this.question() as CseCountryQuestion;
    return q.validation?.max ?? null;
  }

  protected selectOption(option: any): void {
    const val = this.getOptionValue(option);
    const type = this.question().type;

    if (type === 'SINGLE_SELECT' || type === 'single-choice') {
      this.answerChange.emit(val);
    } else if (type === 'MULTI_SELECT' || type === 'multi-choice') {
      const current = Array.isArray(this.currentAnswer()) ? [...this.currentAnswer()] : [];
      const index = current.indexOf(val);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(val);
      }
      this.answerChange.emit(current);
    }
  }

  protected isOptionSelected(option: any): boolean {
    const ans = this.currentAnswer();
    const val = this.getOptionValue(option);
    const type = this.question().type;

    if (type === 'SINGLE_SELECT' || type === 'single-choice') {
      return ans === val;
    }
    if (type === 'MULTI_SELECT' || type === 'multi-choice') {
      return Array.isArray(ans) && ans.includes(val);
    }
    return false;
  }

  readonly subjects = [
    { key: 'english', label: 'English' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'biology', label: 'Biology' },
    { key: 'physics', label: 'Physics' },
    { key: 'mathematics', label: 'Mathematics' }
  ];

  protected getSubjectMark(subjectKey: string): number | '' {
    const ans = this.currentAnswer();
    if (ans && typeof ans === 'object' && ans[subjectKey] !== undefined && ans[subjectKey] !== null && ans[subjectKey] !== '') {
      return ans[subjectKey];
    }
    return '';
  }

  protected onSubjectMarkChange(subjectKey: string, event: Event): void {
    const valStr = (event.target as HTMLInputElement).value;
    const val = valStr === '' ? null : Number(valStr);
    const currentObj = (this.currentAnswer() && typeof this.currentAnswer() === 'object') ? { ...this.currentAnswer() } : {};
    
    currentObj[subjectKey] = val;
    this.answerChange.emit(currentObj);
  }

  protected onTextChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.answerChange.emit(val);
  }

  protected onNumberChange(event: Event): void {
    const valStr = (event.target as HTMLInputElement).value;
    const val = valStr === '' ? null : Number(valStr);
    this.answerChange.emit(val);
  }
}

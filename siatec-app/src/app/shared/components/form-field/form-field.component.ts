import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { Checkbox } from 'primeng/checkbox';
import { RadioButton } from 'primeng/radiobutton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Password } from 'primeng/password';

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'date' 
  | 'dropdown' 
  | 'multiselect' 
  | 'checkbox' 
  | 'radio'
  | 'switch';

export interface DropdownOption {
  label: string;
  value: any;
}

/**
 * Componente reutilizable para campos de formulario con PrimeNG
 * Maneja validaciones y estados de error de forma consistente
 * 
 * @example
 * ```typescript
 * <app-form-field
 *   label="Nombre completo"
 *   type="text"
 *   [(value)]="formData.name"
 *   [required]="true"
 *   [error]="errors.name"
 *   placeholder="Ingrese su nombre"
 * />
 * ```
 */
@Component({
  selector: 'app-form-field',
  imports: [
    CommonModule,
    FormsModule,
    InputText,
    Textarea,
    InputNumber,
    DatePicker,
    Select,
    MultiSelect,
    Checkbox,
    RadioButton,
    ToggleSwitch,
    Password
  ],
  template: `
    <div class="field" [class.mb-4]="!noMargin()">
      @if (label() && type() !== 'checkbox' && type() !== 'switch') {
        <label [for]="id()" class="block mb-2">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      @switch (type()) {
        @case ('text') {
          <input
            pInputText
            [id]="id()"
            [type]="inputType()"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [required]="required()"
            [class]="'w-full ' + (error() ? 'p-invalid' : '')"
          />
        }
        
        @case ('email') {
          <input
            pInputText
            [id]="id()"
            type="email"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [required]="required()"
            [class]="'w-full ' + (error() ? 'p-invalid' : '')"
          />
        }

        @case ('password') {
          <p-password
            [id]="id()"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [toggleMask]="true"
            [feedback]="showPasswordStrength()"
            [class]="'w-full ' + (error() ? 'p-invalid' : '')"
            styleClass="w-full"
            [inputStyleClass]="'w-full'"
          />
        }

        @case ('number') {
          <p-inputNumber
            [id]="id()"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [min]="min()"
            [max]="max()"
            [mode]="numberMode()"
            [currency]="currency()"
            [locale]="locale()"
            [class]="'w-full ' + (error() ? 'p-invalid' : '')"
            styleClass="w-full"
            [inputStyleClass]="'w-full'"
          />
        }

        @case ('textarea') {
          <textarea
            pInputTextarea
            [id]="id()"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [rows]="rows()"
            [autoResize]="autoResize()"
            [class]="'w-full ' + (error() ? 'p-invalid' : '')"
          ></textarea>
        }

        @case ('date') {
          <p-calendar
            [id]="id()"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [showIcon]="true"
            dateFormat="dd/mm/yy"
            [class]="'w-full ' + (error() ? 'p-invalid' : '')"
            styleClass="w-full"
            [inputStyleClass]="'w-full'"
          />
        }

        @case ('dropdown') {
          <p-dropdown
            [id]="id()"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            [options]="options()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [filter]="filterDropdown()"
            [showClear]="!required()"
            optionLabel="label"
            optionValue="value"
            [class]="'w-full ' + (error() ? 'p-invalid' : '')"
            styleClass="w-full"
          />
        }

        @case ('multiselect') {
          <p-multiSelect
            [id]="id()"
            [(ngModel)]="value"
            (ngModelChange)="onValueChange($event)"
            [options]="options()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [filter]="filterDropdown()"
            optionLabel="label"
            optionValue="value"
            [class]="'w-full ' + (error() ? 'p-invalid' : '')"
            styleClass="w-full"
            display="chip"
          />
        }

        @case ('checkbox') {
          <div class="flex align-items-center">
            <p-checkbox
              [id]="id()"
              [(ngModel)]="value"
              (ngModelChange)="onValueChange($event)"
              [binary]="true"
              [disabled]="disabled()"
              [class]="error() ? 'p-invalid' : ''"
            />
            @if (label()) {
              <label [for]="id()" class="ml-2 cursor-pointer">
                {{ label() }}
                @if (required()) {
                  <span class="text-red-500">*</span>
                }
              </label>
            }
          </div>
        }

        @case ('switch') {
          <div class="flex align-items-center">
            @if (label()) {
              <label [for]="id()" class="mr-2">
                {{ label() }}
              </label>
            }
            <p-inputSwitch
              [id]="id()"
              [(ngModel)]="value"
              (ngModelChange)="onValueChange($event)"
              [disabled]="disabled()"
            />
          </div>
        }
      }

      @if (hint() && !error()) {
        <small class="block mt-1 text-gray-600">{{ hint() }}</small>
      }

      @if (error()) {
        <small class="block mt-1 text-red-500">{{ error() }}</small>
      }
    </div>
  `
})
export class FormFieldComponent {
  // Inputs
  id = input<string>('field-' + Math.random().toString(36).substr(2, 9));
  label = input<string>('');
  type = input<FieldType>('text');
  value = input<any>();
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  error = input<string>('');
  hint = input<string>('');
  options = input<DropdownOption[]>([]);
  rows = input<number>(3);
  autoResize = input<boolean>(true);
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);
  numberMode = input<'decimal' | 'currency'>('decimal');
  currency = input<string>('USD');
  locale = input<string>('es-MX');
  filterDropdown = input<boolean>(true);
  showPasswordStrength = input<boolean>(true);
  inputType = input<string>('text');
  noMargin = input<boolean>(false);

  // Outputs
  valueChange = output<any>();

  onValueChange(newValue: any) {
    this.valueChange.emit(newValue);
  }
}

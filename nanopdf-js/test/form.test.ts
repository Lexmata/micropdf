import { describe, it, expect, beforeEach } from 'vitest';
import {
  FieldType,
  TextFormat,
  FieldAlignment,
  FormField,
  TextField,
  CheckboxField,
  PushButtonField,
  ComboBoxField,
  SignatureField
} from '../src/form';
import { Rect } from '../src/geometry';

describe('Form Module', () => {
  describe('FieldType', () => {
    it('should have all field types defined', () => {
      expect(FieldType.Text).toBeDefined();
      expect(FieldType.Checkbox).toBeDefined();
      expect(FieldType.Radio).toBeDefined();
      expect(FieldType.PushButton).toBeDefined();
      expect(FieldType.ComboBox).toBeDefined();
      expect(FieldType.ListBox).toBeDefined();
      expect(FieldType.Signature).toBeDefined();
      expect(FieldType.Unknown).toBeDefined();
    });
  });

  describe('TextFormat', () => {
    it('should have all text formats defined', () => {
      expect(TextFormat.Normal).toBeDefined();
      expect(TextFormat.Number).toBeDefined();
      expect(TextFormat.Percent).toBeDefined();
      expect(TextFormat.Date).toBeDefined();
      expect(TextFormat.Time).toBeDefined();
      expect(TextFormat.Special).toBeDefined();
    });
  });

  describe('FieldAlignment', () => {
    it('should have all alignments defined', () => {
      expect(FieldAlignment.Left).toBeDefined();
      expect(FieldAlignment.Center).toBeDefined();
      expect(FieldAlignment.Right).toBeDefined();
    });
  });

  describe('TextField', () => {
    let field: TextField;

    beforeEach(() => {
      field = new TextField(null as any, 1, 0);
    });

    it('should create a text field', () => {
      expect(field).toBeDefined();
      expect(field.type).toBe(FieldType.Text);
    });

    it('should get field name', () => {
      const name = field.getName();
      expect(typeof name).toBe('string');
    });

    it('should get field value', () => {
      const value = field.getValue();
      expect(typeof value === 'string' || value === null).toBe(true);
    });

    it('should set field value', () => {
      field.setValue('Test Value');
      expect(field.getValue()).toBe('Test Value');
    });

    it('should get field rect', () => {
      const rect = field.getRect();
      expect(rect).toBeInstanceOf(Rect);
    });

    it('should get field flags', () => {
      const flags = field.getFlags();
      expect(typeof flags).toBe('number');
    });

    it('should set field flags', () => {
      field.setFlags(0x01);
      expect(field.getFlags()).toBe(0x01);
    });

    it('should check if read-only', () => {
      const isReadOnly = field.isReadOnly();
      expect(typeof isReadOnly).toBe('boolean');
    });

    it('should check if required', () => {
      const isRequired = field.isRequired();
      expect(typeof isRequired).toBe('boolean');
    });

    it('should check if multiline', () => {
      const isMultiline = field.isMultiline();
      expect(typeof isMultiline).toBe('boolean');
    });

    it('should check if password', () => {
      const isPassword = field.isPassword();
      expect(typeof isPassword).toBe('boolean');
    });

    it('should get max length', () => {
      const maxLen = field.getMaxLen();
      expect(typeof maxLen).toBe('number');
    });

    it('should set max length', () => {
      field.setMaxLen(100);
      expect(field.getMaxLen()).toBe(100);
    });

    it('should get text format', () => {
      const format = field.getTextFormat();
      expect(Object.values(TextFormat)).toContain(format);
    });

    it('should get border width', () => {
      const width = field.getBorderWidth();
      expect(typeof width).toBe('number');
    });

    it('should set border width', () => {
      field.setBorderWidth(2);
      expect(field.getBorderWidth()).toBe(2);
    });

    it('should get border color', () => {
      const color = field.getBorderColor();
      expect(Array.isArray(color)).toBe(true);
    });

    it('should set border color', () => {
      field.setBorderColor([0, 0, 0]);
      expect(field.getBorderColor()).toEqual([0, 0, 0]);
    });

    it('should get background color', () => {
      const color = field.getBackgroundColor();
      expect(Array.isArray(color)).toBe(true);
    });

    it('should set background color', () => {
      field.setBackgroundColor([1, 1, 1]);
      expect(field.getBackgroundColor()).toEqual([1, 1, 1]);
    });

    it('should get font size', () => {
      const fontSize = field.getFontSize();
      expect(typeof fontSize).toBe('number');
    });

    it('should set font size', () => {
      field.setFontSize(14);
      expect(field.getFontSize()).toBe(14);
    });

    it('should get alignment', () => {
      const alignment = field.getAlignment();
      expect(Object.values(FieldAlignment)).toContain(alignment);
    });

    it('should set alignment', () => {
      field.setAlignment(FieldAlignment.Center);
      expect(field.getAlignment()).toBe(FieldAlignment.Center);
    });

    it('should set default value', () => {
      field.setDefaultValue('Default');
      // Default value is internal, can't directly verify
    });

    it('should validate', () => {
      const isValid = field.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should clone', () => {
      const cloned = field.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(TextField);
    });
  });

  describe('CheckboxField', () => {
    let field: CheckboxField;

    beforeEach(() => {
      field = new CheckboxField(null as any, 1, 0);
    });

    it('should create a checkbox field', () => {
      expect(field).toBeDefined();
      expect(field.type).toBe(FieldType.Checkbox);
    });

    it('should check if checked', () => {
      const isChecked = field.isChecked();
      expect(typeof isChecked).toBe('boolean');
    });

    it('should set checked state', () => {
      field.setChecked(true);
      expect(field.isChecked()).toBe(true);

      field.setChecked(false);
      expect(field.isChecked()).toBe(false);
    });

    it('should toggle checked state', () => {
      const initial = field.isChecked();
      field.setChecked(!initial);
      expect(field.isChecked()).toBe(!initial);
    });

    it('should validate', () => {
      const isValid = field.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should clone', () => {
      const cloned = field.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(CheckboxField);
    });
  });

  describe('PushButtonField', () => {
    let field: PushButtonField;

    beforeEach(() => {
      field = new PushButtonField(null as any, 1, 0);
    });

    it('should create a push button field', () => {
      expect(field).toBeDefined();
      expect(field.type).toBe(FieldType.PushButton);
    });

    it('should get caption', () => {
      const caption = field.getValue();
      expect(typeof caption === 'string' || caption === null).toBe(true);
    });

    it('should set caption', () => {
      field.setValue('Click Me');
      expect(field.getValue()).toBe('Click Me');
    });

    it('should validate', () => {
      const isValid = field.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should clone', () => {
      const cloned = field.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(PushButtonField);
    });
  });

  describe('ComboBoxField', () => {
    let field: ComboBoxField;

    beforeEach(() => {
      field = new ComboBoxField(null as any, 1, 0);
    });

    it('should create a combo box field', () => {
      expect(field).toBeDefined();
      expect(field.type).toBe(FieldType.ComboBox);
    });

    it('should get choice count', () => {
      const count = field.getChoiceCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should add choice', () => {
      const initialCount = field.getChoiceCount();
      field.addChoice('Option 1', 'opt1');
      expect(field.getChoiceCount()).toBe(initialCount + 1);
    });

    it('should get choice label', () => {
      field.addChoice('Option 1', 'opt1');
      const label = field.getChoiceLabel(0);
      expect(label).toBe('Option 1');
    });

    it('should get choice value', () => {
      field.addChoice('Option 1', 'opt1');
      const value = field.getChoiceValue(0);
      expect(value).toBe('opt1');
    });

    it('should remove choice', () => {
      field.addChoice('Option 1', 'opt1');
      const count = field.getChoiceCount();
      field.removeChoice(0);
      expect(field.getChoiceCount()).toBe(count - 1);
    });

    it('should check if combo', () => {
      const isCombo = field.isCombo();
      expect(typeof isCombo).toBe('boolean');
    });

    it('should check if edit', () => {
      const isEdit = field.isEdit();
      expect(typeof isEdit).toBe('boolean');
    });

    it('should check if multiselect', () => {
      const isMulti = field.isMultiselect();
      expect(typeof isMulti).toBe('boolean');
    });

    it('should get selected index', () => {
      const index = field.getSelectedIndex();
      expect(typeof index).toBe('number');
    });

    it('should set selected index', () => {
      field.addChoice('Option 1', 'opt1');
      field.addChoice('Option 2', 'opt2');
      field.setSelectedIndex(1);
      expect(field.getSelectedIndex()).toBe(1);
    });

    it('should clear selection', () => {
      field.addChoice('Option 1', 'opt1');
      field.setSelectedIndex(0);
      field.clearSelection();
      expect(field.getSelectedIndex()).toBe(-1);
    });

    it('should validate', () => {
      const isValid = field.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should clone', () => {
      const cloned = field.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(ComboBoxField);
    });
  });

  describe('SignatureField', () => {
    let field: SignatureField;

    beforeEach(() => {
      field = new SignatureField(null as any, 1, 0);
    });

    it('should create a signature field', () => {
      expect(field).toBeDefined();
      expect(field.type).toBe(FieldType.Signature);
    });

    it('should check if signed', () => {
      const isSigned = field.isSigned();
      expect(typeof isSigned).toBe('boolean');
    });

    it('should validate', () => {
      const isValid = field.isValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should clone', () => {
      const cloned = field.clone();
      expect(cloned).toBeDefined();
      expect(cloned).toBeInstanceOf(SignatureField);
    });
  });

  describe('Form Integration', () => {
    it('should create multiple field types', () => {
      const text = new TextField(null as any, 1, 0);
      const checkbox = new CheckboxField(null as any, 1, 1);
      const button = new PushButtonField(null as any, 1, 2);
      const combo = new ComboBoxField(null as any, 1, 3);
      const signature = new SignatureField(null as any, 1, 4);

      expect(text.type).toBe(FieldType.Text);
      expect(checkbox.type).toBe(FieldType.Checkbox);
      expect(button.type).toBe(FieldType.PushButton);
      expect(combo.type).toBe(FieldType.ComboBox);
      expect(signature.type).toBe(FieldType.Signature);
    });

    it('should handle form field styling', () => {
      const field = new TextField(null as any, 1, 0);

      field.setBorderWidth(2);
      field.setBorderColor([0, 0, 0]);
      field.setBackgroundColor([1, 1, 1]);
      field.setFontSize(12);
      field.setAlignment(FieldAlignment.Center);

      expect(field.getBorderWidth()).toBe(2);
      expect(field.getBorderColor()).toEqual([0, 0, 0]);
      expect(field.getBackgroundColor()).toEqual([1, 1, 1]);
      expect(field.getFontSize()).toBe(12);
      expect(field.getAlignment()).toBe(FieldAlignment.Center);
    });

    it('should handle combo box with multiple options', () => {
      const combo = new ComboBoxField(null as any, 1, 0);

      combo.addChoice('Small', 'S');
      combo.addChoice('Medium', 'M');
      combo.addChoice('Large', 'L');
      combo.addChoice('X-Large', 'XL');

      expect(combo.getChoiceCount()).toBe(4);
      expect(combo.getChoiceLabel(1)).toBe('Medium');
      expect(combo.getChoiceValue(2)).toBe('L');
    });

    it('should handle text field constraints', () => {
      const field = new TextField(null as any, 1, 0);

      field.setMaxLen(50);
      field.setValue('This is a test value');

      expect(field.getMaxLen()).toBe(50);
      expect(field.getValue()).toBe('This is a test value');
    });

    it('should handle field validation', () => {
      const text = new TextField(null as any, 1, 0);
      const checkbox = new CheckboxField(null as any, 1, 1);
      const combo = new ComboBoxField(null as any, 1, 2);

      expect(typeof text.isValid()).toBe('boolean');
      expect(typeof checkbox.isValid()).toBe('boolean');
      expect(typeof combo.isValid()).toBe('boolean');
    });
  });
});

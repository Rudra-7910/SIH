import React, { useState } from 'react';
import { ExtractedField, FieldName } from '../types';
import { Edit2, Check, FileCheck2 } from 'lucide-react';

interface Props {
  fields: ExtractedField[];
  highlightedBoxId: string | null;
  onFieldClick: (boundingBoxId: string) => void;
  onFieldOverride?: (fieldName: FieldName, newValue: string) => void;
}

const FRIENDLY_LABELS: Record<string, { name: string; rule: string }> = {
  generic_name: { name: 'Product name', rule: 'Rule 6(1)(a)' },
  net_quantity: { name: 'Net quantity (weight/volume)', rule: 'Rule 6(1)(b)' },
  manufacturer: { name: 'Manufacturer / packer', rule: 'Rule 6(1)(c)' },
  date_of_manufacture: { name: 'Manufacturing / packing date', rule: 'Rule 6(1)(d)' },
  mrp: { name: 'Maximum retail price (MRP)', rule: 'Rule 6(1)(e)' },
  consumer_care: { name: 'Customer care contact', rule: 'Rule 6(1)(f)' },
  best_before: { name: 'Best before / expiry', rule: 'PCR / FSSAI' },
  country_of_origin: { name: 'Country of origin', rule: 'Rule 6(10)' },
};

export const DeclarationTable: React.FC<Props> = ({
  fields,
  highlightedBoxId,
  onFieldClick,
  onFieldOverride,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (fields.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileCheck2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">Nothing found yet</p>
        <p className="text-xs text-slate-500 mt-1">Upload a photo to see label details here</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
        These are the details read from the package. Tap a row to highlight it on the photo.
      </p>
      <div className="space-y-2">
        {fields.map((f) => {
          const label = FRIENDLY_LABELS[f.fieldName] || { name: f.displayName, rule: 'Rule 6' };
          const isHighlighted = highlightedBoxId === f.boundingBoxId;
          const isEditing = editingField === f.fieldName;
          const confPercent = Math.round(f.confidence * 100);
          const confLabel = confPercent >= 90 ? 'High confidence' : confPercent >= 70 ? 'Medium confidence' : 'Low confidence — please verify';

          return (
            <div
              key={f.fieldName}
              onClick={() => onFieldClick(f.boundingBoxId)}
              className={`p-3 rounded-sm border cursor-pointer transition-colors ${
                isHighlighted ? 'border-lmed-blue bg-lmed-blue/10' : 'border-lmed-border bg-canvas-alt hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{label.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{label.rule}</p>
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm shrink-0 ${
                    confPercent >= 90 ? 'status-compliant' : confPercent >= 70 ? 'status-review' : 'status-breach'
                  }`}
                >
                  {confPercent}%
                </span>
              </div>

              {isEditing ? (
                <div className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 bg-lmed-card border border-lmed-blue rounded-sm text-sm text-slate-100"
                    autoFocus
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onFieldOverride && editValue.trim()) onFieldOverride(f.fieldName, editValue.trim());
                      setEditingField(null);
                    }}
                    className="p-1.5 text-lmed-pass"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-sm text-slate-200 font-medium">{f.value}</p>
                  {onFieldOverride && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingField(f.fieldName); setEditValue(f.value); }}
                      className="p-1 text-slate-500 hover:text-lmed-blue shrink-0"
                      title="Correct this value"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-1">{confLabel}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

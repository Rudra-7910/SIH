import React, { useState } from 'react';
import { ExtractedField, FieldName } from '../types';
import { Edit2, Check, FileCheck2 } from 'lucide-react';

interface Props {
  fields: ExtractedField[];
  highlightedBoxId: string | null;
  onFieldClick: (boundingBoxId: string) => void;
  onFieldOverride?: (fieldName: FieldName, newValue: string) => void;
}

const FIELD_META: Record<string, { name: string; rule: string }> = {
  generic_name:        { name: 'Product Name',                  rule: 'Rule 6(1)(a) · PCR 2011' },
  net_quantity:        { name: 'Net Quantity',                   rule: 'Rule 6(1)(b) · PCR 2011' },
  manufacturer:        { name: 'Manufacturer / Packer',         rule: 'Rule 6(1)(c) · PCR 2011' },
  date_of_manufacture: { name: 'Date of Manufacture / Packing', rule: 'Rule 6(1)(d) · PCR 2011' },
  mrp:                 { name: 'Maximum Retail Price (MRP)',     rule: 'Rule 6(1)(e) · PCR 2011' },
  consumer_care:       { name: 'Consumer Care Contact',         rule: 'Rule 6(1)(f) · PCR 2011' },
  best_before:         { name: 'Best Before / Expiry',          rule: 'FSSAI / PCR 2011' },
  country_of_origin:   { name: 'Country of Origin',             rule: 'Rule 6(10) · PCR 2011' },
};

function ConfBar({ conf }: { conf: number }) {
  const color = conf >= 90 ? 'var(--gov-pass)' : conf >= 70 ? 'var(--gov-saffron-border)' : 'var(--gov-breach)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="gov-conf-bar" style={{ flex: 1, minWidth: 48 }}>
        <div style={{ height: 3, width: `${conf}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: conf >= 90 ? 'var(--gov-pass)' : conf >= 70 ? 'var(--gov-saffron)' : 'var(--gov-breach)', whiteSpace: 'nowrap' }}>
        {conf.toFixed(1)}%
      </span>
    </div>
  );
}

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
      <div style={{ padding: 32, textAlign: 'center' }}>
        <FileCheck2 style={{ width: 32, height: 32, margin: '0 auto 8px', color: 'var(--gov-border-strong)' }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--gov-text-secondary)' }}>No declarations extracted yet</p>
        <p style={{ fontSize: 12, color: 'var(--gov-text-muted)', marginTop: 4 }}>Upload a package photo or select a demo scenario</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="gov-table">
        <thead>
          <tr>
            <th>Declaration</th>
            <th>Extracted Value</th>
            <th style={{ width: 130 }}>Confidence</th>
            <th style={{ width: 100 }}>Status</th>
            {onFieldOverride && <th style={{ width: 50 }}></th>}
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => {
            const meta = FIELD_META[f.fieldName] || { name: f.displayName, rule: 'Rule 6' };
            const isHighlighted = highlightedBoxId === f.boundingBoxId;
            const isEditing = editingField === f.fieldName;
            const conf = Math.round(f.confidence * 100);

            return (
              <tr
                key={f.fieldName}
                onClick={() => onFieldClick(f.boundingBoxId)}
                className={isHighlighted ? 'row-highlighted' : ''}
                style={{ cursor: 'pointer' }}
              >
                {/* Declaration */}
                <td>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--gov-text-primary)' }}>{meta.name}</p>
                  <p style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--gov-text-muted)', marginTop: 2 }}>{meta.rule}</p>
                </td>

                {/* Extracted Value */}
                <td>
                  {isEditing ? (
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="gov-input"
                        style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onFieldOverride && editValue.trim()) onFieldOverride(f.fieldName, editValue.trim());
                          setEditingField(null);
                        }}
                        style={{ padding: '4px 8px', background: 'var(--gov-pass)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      >
                        <Check style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, color: 'var(--gov-text-primary)' }}>
                      {f.value}
                    </span>
                  )}
                </td>

                {/* Confidence */}
                <td><ConfBar conf={conf} /></td>

                {/* Status */}
                <td>
                  <span
                    className={`gov-badge ${
                      conf >= 90 ? 'gov-badge-pass' : conf >= 70 ? 'gov-badge-review' : 'gov-badge-breach'
                    }`}
                  >
                    {conf >= 90 ? 'HIGH' : conf >= 70 ? 'MEDIUM' : 'LOW'}
                  </span>
                </td>

                {/* Edit */}
                {onFieldOverride && (
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField(f.fieldName);
                        setEditValue(f.value);
                      }}
                      title="Correct this value"
                      style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gov-text-muted)' }}
                    >
                      <Edit2 style={{ width: 13, height: 13 }} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

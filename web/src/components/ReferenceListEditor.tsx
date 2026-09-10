import { useEffect, useState } from 'react';
import type { ReferenceListItem } from '../types';

interface Props {
  itemLabel: string;
  api: {
    list: () => Promise<ReferenceListItem[]>;
    create: (libelle: string) => Promise<ReferenceListItem>;
    update: (id: number, libelle: string) => Promise<ReferenceListItem>;
    delete: (id: number) => Promise<void>;
  };
  notify: (message: string, warn?: boolean) => void;
}

// CRUD générique pour les listes de référence de Configuration globale
// (Banques, Types de compte Liquidités — ticket 05) : même forme id+libelle,
// même règle de suppression bloquée si référencée, dans les deux cas.
export function ReferenceListEditor({ itemLabel, api, notify }: Props) {
  const [items, setItems] = useState<ReferenceListItem[]>([]);
  const [newLibelle, setNewLibelle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLibelle, setEditingLibelle] = useState('');

  const load = () => {
    api.list().then(setItems);
  };

  useEffect(load, []);

  const create = async () => {
    const libelle = newLibelle.trim();
    if (!libelle) return;
    try {
      await api.create(libelle);
      setNewLibelle('');
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur lors de la création', true);
    }
  };

  const startEdit = (item: ReferenceListItem) => {
    setEditingId(item.id);
    setEditingLibelle(item.libelle);
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    const libelle = editingLibelle.trim();
    if (!libelle) return;
    try {
      await api.update(editingId, libelle);
      setEditingId(null);
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur lors de la modification', true);
    }
  };

  const remove = async (item: ReferenceListItem) => {
    if (!window.confirm(`Supprimer « ${item.libelle} » ?`)) return;
    try {
      await api.delete(item.id);
      notify(`${itemLabel} « ${item.libelle} » supprimé${itemLabel.endsWith('e') ? 'e' : ''}`);
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur lors de la suppression', true);
    }
  };

  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <table className="report-table">
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {editingId === item.id ? (
                  <input
                    className="field-input"
                    type="text"
                    value={editingLibelle}
                    onChange={(e) => setEditingLibelle(e.target.value)}
                    autoFocus
                  />
                ) : (
                  item.libelle
                )}
              </td>
              <td style={{ width: 1, whiteSpace: 'nowrap', textAlign: 'right' }}>
                {editingId === item.id ? (
                  <>
                    <button type="button" className="btn small primary" onClick={saveEdit}>
                      Enregistrer
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => setEditingId(null)}>
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn small ghost" onClick={() => startEdit(item)}>
                      Modifier
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => remove(item)}>
                      Supprimer
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="field-row" style={{ marginTop: 14 }}>
        <label>Nouveau : {itemLabel}</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="field-input"
            type="text"
            value={newLibelle}
            onChange={(e) => setNewLibelle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <button type="button" className="btn primary" onClick={create}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

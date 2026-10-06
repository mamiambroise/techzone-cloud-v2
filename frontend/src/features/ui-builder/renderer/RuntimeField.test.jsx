import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import RuntimeField from './RuntimeField.jsx';
afterEach(cleanup);
const node = { id:'field', type:'FormField', bindings:{value:{kind:'ENTITY_FIELD',entity:'entry',field:'value'}} };
const context = field => ({ businessContext:{ applicationVersionId:'version', entities:[{code:'entry',fields:[{code:'value',label:'Valeur',...field}]}] } });
describe('Metadata-driven fields', () => {
  it('renders an accessible ENUM select with declared values only', () => {
    render(<RuntimeField node={node} ctx={context({type:'ENUM',options:['OPEN','CLOSED']})} />);
    const select=screen.getByLabelText('Valeur');
    expect(select.tagName).toBe('SELECT');
    fireEvent.change(select,{target:{value:'CLOSED'}});
    expect(select.value).toBe('CLOSED');
    expect(screen.getAllByRole('option').map(x=>x.value)).toEqual(['','OPEN','CLOSED']);
  });
  it('uses a textarea for LONG_TEXT and number step=any for DECIMAL', () => {
    const view=render(<RuntimeField node={node} ctx={context({type:'LONG_TEXT'})} />);
    expect(screen.getByLabelText('Valeur').tagName).toBe('TEXTAREA');
    view.rerender(<RuntimeField node={node} ctx={context({type:'DECIMAL'})} />);
    expect(screen.getByLabelText('Valeur').type).toBe('number');
    expect(screen.getByLabelText('Valeur').step).toBe('any');
  });
  it('does not let UI props override a readonly business field', () => {
    render(<RuntimeField node={{...node,props:{readonly:false}}} ctx={context({type:'TEXT',readonly:true})} />);
    expect(screen.getByLabelText('Valeur').disabled).toBe(true);
  });
});

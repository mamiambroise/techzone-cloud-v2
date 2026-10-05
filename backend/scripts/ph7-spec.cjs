// Declarative Phase 7 definitions. Business names belong here, never in the runtime.
const sharedParty = 'code:TEXT!# name:TEXT! phone:TEXT email:EMAIL address:LONG_TEXT active:BOOLEAN';
const paymentMethods = 'CASH,MOBILE_MONEY,BANK_TRANSFER,CARD';
const orderStates = 'DRAFT,CONFIRMED,CANCELLED,COMPLETED';
function entity(name, fields) {
  return { name, code: name.toLowerCase(), fields: fields.split(' ').map(token => {
    const [label, definition] = token.split(':');
    const required = definition.includes('!'), unique = definition.includes('#');
    const clean = definition.replace(/[!#]/g, '');
    const [kind, argument] = clean.split('=');
    return { code: label.toLowerCase(), label, type: kind, required, unique,
      ...(kind === 'RELATION' ? { target: argument.toLowerCase() } : {}),
      ...(kind === 'ENUM' ? { values: argument.split(',') } : {}) };
  }) };
}
const wifi = {
  code: 'WIFI_SERVICES', name: 'Gestion WiFi & Services', tenant: 'techzone-wifi-services', commercialName: 'Techzone WiFi Services',
  entities: [
    entity('Customer', sharedParty),
    entity('InternetOffer', 'code:TEXT!# name:TEXT! downloadSpeed:DECIMAL! uploadSpeed:DECIMAL! monthlyPrice:DECIMAL! description:LONG_TEXT active:BOOLEAN'),
    entity('Subscription', 'number:TEXT!# customer:RELATION=Customer! internetOffer:RELATION=InternetOffer! startDate:DATE status:ENUM=PENDING,ACTIVE,SUSPENDED,CANCELLED monthlyPrice:DECIMAL'),
    entity('Service', 'code:TEXT!# name:TEXT! description:LONG_TEXT price:DECIMAL active:BOOLEAN'),
    entity('Supplier', sharedParty),
    entity('NetworkEquipment', 'reference:TEXT!# name:TEXT! brand:TEXT category:TEXT purchasePrice:DECIMAL salePrice:DECIMAL stock:DECIMAL supplier:RELATION=Supplier active:BOOLEAN'),
    entity('Order', `number:TEXT!# customer:RELATION=Customer! date:DATE status:ENUM=${orderStates} subtotal:DECIMAL discount:DECIMAL total:DECIMAL`),
    entity('OrderLine', 'order:RELATION=Order! itemType:ENUM=EQUIPMENT,SERVICE networkEquipment:RELATION=NetworkEquipment service:RELATION=Service quantity:DECIMAL! unitPrice:DECIMAL! total:DECIMAL!'),
    entity('Payment', `reference:TEXT!# order:RELATION=Order! date:DATE amount:DECIMAL! paymentMethod:ENUM=${paymentMethods} status:ENUM=PENDING,PAID,FAILED,CANCELLED`),
    entity('Installation', 'number:TEXT!# customer:RELATION=Customer! subscription:RELATION=Subscription scheduledDate:DATE installationDate:DATE address:LONG_TEXT status:ENUM=PLANNED,IN_PROGRESS,COMPLETED,CANCELLED technicianName:TEXT'),
    entity('Intervention', 'number:TEXT!# customer:RELATION=Customer! subscription:RELATION=Subscription date:DATE type:ENUM=INSTALLATION,MAINTENANCE,REPAIR,DIAGNOSTIC description:LONG_TEXT status:ENUM=OPEN,IN_PROGRESS,COMPLETED,CANCELLED'),
  ],
  actions: { subscription: { activate: 'ACTIVE', suspend: 'SUSPENDED', cancel: 'CANCELLED' }, order: { confirm: 'CONFIRMED', cancel: 'CANCELLED' }, installation: { complete: 'COMPLETED' }, intervention: { complete: 'COMPLETED' } },
  configuration: { customerPrefix: 'CLI', subscriptionPrefix: 'ABO', orderPrefix: 'CMD', paymentPrefix: 'PAY', 'features.subscriptions': true, 'features.services': true, 'features.equipment': true, 'features.interventions': true },
  navigation: { Clients: ['customer'], Internet: ['internetoffer','subscription','installation'], Services: ['service','intervention'], Equipment: ['networkequipment'], Suppliers: ['supplier'], Orders: ['order'], Payments: ['payment'] },
};
const it = {
  code: 'IT_SALES', name: 'Gestion Vente Informatique', tenant: 'techzone-informatique', commercialName: 'Techzone Informatique',
  entities: [
    entity('Category', 'code:TEXT!# name:TEXT! description:LONG_TEXT active:BOOLEAN'),
    entity('Brand', 'code:TEXT!# name:TEXT! active:BOOLEAN'),
    entity('Supplier', sharedParty),
    entity('Product', 'reference:TEXT!# name:TEXT! description:LONG_TEXT category:RELATION=Category! brand:RELATION=Brand supplier:RELATION=Supplier purchasePrice:DECIMAL salePrice:DECIMAL! stock:DECIMAL minimumStock:DECIMAL active:BOOLEAN'),
    entity('Customer', sharedParty),
    entity('CustomerOrder', `number:TEXT!# customer:RELATION=Customer! date:DATE status:ENUM=${orderStates} subtotal:DECIMAL discount:DECIMAL total:DECIMAL`),
    entity('CustomerOrderLine', 'customerOrder:RELATION=CustomerOrder! product:RELATION=Product! quantity:DECIMAL! unitPrice:DECIMAL! discount:DECIMAL total:DECIMAL!'),
    entity('Sale', 'number:TEXT!# customer:RELATION=Customer date:DATE subtotal:DECIMAL discount:DECIMAL total:DECIMAL paymentStatus:ENUM=UNPAID,PARTIAL,PAID'),
    entity('SaleLine', 'sale:RELATION=Sale! product:RELATION=Product! quantity:DECIMAL! unitPrice:DECIMAL! discount:DECIMAL total:DECIMAL!'),
    entity('PurchaseOrder', 'number:TEXT!# supplier:RELATION=Supplier! date:DATE status:ENUM=DRAFT,ORDERED,RECEIVED,CANCELLED total:DECIMAL'),
    entity('PurchaseOrderLine', 'purchaseOrder:RELATION=PurchaseOrder! product:RELATION=Product! quantity:DECIMAL! unitCost:DECIMAL! total:DECIMAL!'),
    entity('StockMovement', 'product:RELATION=Product! type:ENUM=IN,OUT,ADJUSTMENT quantity:DECIMAL! date:DATE reference:TEXT'),
    entity('Payment', `reference:TEXT!# sale:RELATION=Sale! date:DATE amount:DECIMAL! method:ENUM=${paymentMethods} status:ENUM=PENDING,PAID,FAILED,CANCELLED`),
  ],
  actions: { purchaseorder: { order: 'ORDERED', receive: 'RECEIVED', cancel: 'CANCELLED' }, customerorder: { confirm: 'CONFIRMED', cancel: 'CANCELLED' }, stockmovement: { in: { field: 'type', value: 'IN' }, out: { field: 'type', value: 'OUT' }, adjustment: { field: 'type', value: 'ADJUSTMENT' } } },
  configuration: { customerPrefix: 'CLI', supplierPrefix: 'FOU', productPrefix: 'PRD', orderPrefix: 'CMD', salePrefix: 'VTE', paymentPrefix: 'PAY', 'features.stock': true, 'features.suppliers': true, 'features.purchases': true, 'features.sales': true },
  navigation: { Catalogue: ['product','category','brand'], Clients: ['customer'], Suppliers: ['supplier'], Purchases: ['purchaseorder'], Stock: ['product','stockmovement'], Sales: ['customerorder','sale'], Payments: ['payment'] },
};
module.exports = { apps: [wifi, it] };

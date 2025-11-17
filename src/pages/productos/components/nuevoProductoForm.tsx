
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// Schema de validación con Zod
const formSchema = z.object({
  nombre_producto: z.string().min(1, 'El nombre del producto es requerido'),
  descripcion: z.string().optional(),
  id_categoria: z.string().optional(),
  precio_costo: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'El precio de costo debe ser mayor a 0'
  ),
  sku_pieza: z.string().optional(),
  sucursales_inventario: z.array(z.number()).min(1, 'Selecciona al menos una sucursal'),
  variantes: z.array(
    z.object({
      nombre_presentacion: z.string().min(1, 'El nombre es requerido'),
      factor_conversion_cantidad: z.number().positive('El factor debe ser mayor a 0'),
      sku_presentacion: z.string().optional(),
      sucursales_venta: z.array(
        z.object({
          id_sucursal: z.number(),
          precio_venta: z.string().refine(
            (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
            'El precio debe ser mayor a 0'
          )
        })
      ).min(1, 'Asigna al menos una sucursal a esta variante')
    })
  ).min(1)
});

type FormValues = z.infer<typeof formSchema>;

export default function ProductForm(){

  const [currentStep, setCurrentStep] = useState(1);
  const [sucursales] = useState([
    { id_sucursal: 1, nombre: 'Sucursal Central' },
    { id_sucursal: 2, nombre: 'Sucursal Xoxo' },
    { id_sucursal: 3, nombre: 'Sucursal Test' }
  ]);
  const [categorias] = useState([
    { id_categoria: 1, category_name: 'Bebidas' }
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_producto: '',
      descripcion: '',
      id_categoria: '',
      precio_costo: '',
      sku_pieza: '',
      sucursales_inventario: [],
      variantes: [
        {
          nombre_presentacion: 'Pieza',
          factor_conversion_cantidad: 1,
          sku_presentacion: '',
          sucursales_venta: []
        }
      ]
    }
  });

  const { watch } = form;
  const variantes = watch('variantes');
  const sucursalesInventario = watch('sucursales_inventario');

  const onSubmit = (values: FormValues) => {
    console.log('Datos del formulario:', values);
    alert('¡Producto creado exitosamente! Revisa la consola.');
  };

  const handleNext = async () => {
  let isValid = false;
  
  if (currentStep === 1) {
    isValid = await form.trigger(['nombre_producto', 'precio_costo']);
  } else if (currentStep === 2) {
    isValid = await form.trigger(['sucursales_inventario']);
  } else if (currentStep === 3) {
    // En paso 3 solo validamos nombre y factor de cada variante
    const variantesActuales = form.getValues('variantes');
    const promesas = variantesActuales.flatMap((_, index) => [
      form.trigger(`variantes.${index}.nombre_presentacion`),
      form.trigger(`variantes.${index}.factor_conversion_cantidad`)
    ]);
    const resultados = await Promise.all(promesas);
    isValid = resultados.every(r => r);
  } else if (currentStep === 4) {
    isValid = await form.trigger(['variantes']);
  }
  
  if (isValid) setCurrentStep(currentStep + 1);
  };

  const addVariante = () => {
    const current = form.getValues('variantes');
    form.setValue('variantes', [
      ...current,
      {
        nombre_presentacion: '',
        factor_conversion_cantidad: 1,
        sku_presentacion: '',
        sucursales_venta: []
      }
    ]);
  };

  const removeVariante = (index: number) => {
    const current = form.getValues('variantes');
    if (current.length > 1) {
      form.setValue('variantes', current.filter((_, i) => i !== index));
    }
  };

  const toggleSucursalVenta = (varianteIndex: number, idSucursal: number) => {
    const current = form.getValues(`variantes.${varianteIndex}.sucursales_venta`);
    const existe = current.find(sv => sv.id_sucursal === idSucursal);
    
    if (existe) {
      form.setValue(
        `variantes.${varianteIndex}.sucursales_venta`,
        current.filter(sv => sv.id_sucursal !== idSucursal)
      );
    } else {
      form.setValue(
        `variantes.${varianteIndex}.sucursales_venta`,
        [...current, { id_sucursal: idSucursal, precio_venta: '' }]
      );
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="nombre_producto"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del Producto *</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Coca Cola 500ml" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="descripcion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea placeholder="Descripción del producto" rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="id_categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id_categoria} value={String(cat.id_categoria)}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="precio_costo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio de Costo Por Pieza *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="sku_pieza"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SKU Pieza</FormLabel>
            <FormControl>
              <Input placeholder="SKU-001" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Selecciona las sucursales donde se guardará el inventario
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="sucursales_inventario"
        render={({ field }) => (
          <FormItem>
            <div className="space-y-3">
              {sucursales.map(sucursal => (
                <div key={sucursal.id_sucursal} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    checked={field.value?.includes(sucursal.id_sucursal)}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      if (checked) {
                        field.onChange([...current, sucursal.id_sucursal]);
                      } else {
                        field.onChange(current.filter(id => id !== sucursal.id_sucursal));
                      }
                    }}
                  />
                  <FormLabel className="cursor-pointer font-normal">
                    {sucursal.nombre}
                  </FormLabel>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Define las variantes. Por defecto incluye "Pieza" con factor 1.
        </AlertDescription>
      </Alert>

      {variantes.map((variante, index) => (
        <Card key={index} className="relative">
          <CardContent className="pt-6 space-y-4">
            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeVariante(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`variantes.${index}.nombre_presentacion`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Paquete, Caja" {...field} disabled={index === 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`variantes.${index}.factor_conversion_cantidad`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factor *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        disabled={index === 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`variantes.${index}.sku_presentacion`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="SKU-PRES-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" className="w-full" onClick={addVariante}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Variante
        </Button>
    </div>
  );

  const renderStep4 = () => (
  <div className="space-y-6">
    <Alert>
      <AlertDescription>
        Asigna precios de venta para cada variante
      </AlertDescription>
    </Alert>

    {variantes.map((variante, vIndex) => (
      <Card key={vIndex}>
        <CardHeader>
          <CardTitle className="text-lg">
            {variante.nombre_presentacion}
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Factor: {variante.factor_conversion_cantidad})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sucursales
            .filter(s => sucursalesInventario?.includes(s.id_sucursal)) // Agregar ?
            .map(sucursal => {
              const sucursalVenta = variante.sucursales_venta.find(
                sv => sv.id_sucursal === sucursal.id_sucursal
              );
              const isSelected = !!sucursalVenta;
              const svIndex = variante.sucursales_venta.findIndex(
                sv => sv.id_sucursal === sucursal.id_sucursal
              );

              return (
                <div key={sucursal.id_sucursal} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSucursalVenta(vIndex, sucursal.id_sucursal)}
                    />
                    <FormLabel className="cursor-pointer font-medium">
                      {sucursal.nombre}
                    </FormLabel>
                  </div>

                  {isSelected && svIndex !== -1 && (
                    <FormField
                      control={form.control}
                      name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_venta`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio de Venta *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              );
            })}

          <FormField
            control={form.control}
            name={`variantes.${vIndex}.sucursales_venta`}
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    ))}
  </div>
   );

  const steps = [
    { number: 1, title: 'Producto Base', component: renderStep1() },
    { number: 2, title: 'Inventario', component: renderStep2() },
    { number: 3, title: 'Variantes', component: renderStep3() },
    { number: 4, title: 'Precios', component: renderStep4() }
  ];

  return (
    <div className="mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Producto</CardTitle>
          <CardDescription>
            Formulario paso a paso para crear productos con variantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        currentStep > step.number
                          ? 'bg-green-500 text-white'
                          : currentStep === step.number
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                    </div>
                    <span className="text-xs mt-2 text-center">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div className="min-h-[400px]">
                {steps[currentStep - 1].component}
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext}>
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Crear Producto
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

import { AlertCircle, Clock, ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NoTurnoError() {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
            <Card className="max-w-xl  shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-destructive/10 dark:bg-destructive/20 p-6 rounded-full">
                            <AlertCircle className="size-16 text-destructive" strokeWidth={2} />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">
                        No hay turno activo
                    </CardTitle>
                    <CardDescription className="text-base">
                        Para acceder al dashboard, primero debes abrir un turno de caja.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <Alert>
                        <Clock />
                        <AlertTitle>Estado del turno</AlertTitle>
                        <AlertDescription>
                            Actualmente no tienes ningún turno iniciado. El sistema requiere un turno activo para registrar operaciones.
                        </AlertDescription>
                    </Alert>

                    <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <Info className="text-blue-600 dark:text-blue-400" />
                        <AlertTitle className="text-blue-900 dark:text-blue-100">
                            Sugerencia
                        </AlertTitle>
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            Dirígete a la página de inicio y abre un nuevo turno para comenzar a trabajar.
                            Esto te permitirá acceder a todas las funcionalidades del sistema.
                        </AlertDescription>
                    </Alert>
                </CardContent>

                <CardFooter className="flex justify-center gap-3">
                    <Button
                        size="lg"
                        onClick={handleGoHome}
                        className="gap-2"
                    >
                        <ArrowLeft className="size-5" />
                        Volver al inicio
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

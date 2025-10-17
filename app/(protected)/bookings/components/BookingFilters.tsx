'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select'
import { Input } from '../../../../components/ui/input'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Calendar } from '../../../../components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover'
import { Label } from '../../../../components/ui/label'
import { Separator } from '../../../../components/ui/separator'
import {
  CalendarIcon,
  Search,
  Filter,
  X,
  RotateCcw,
  MapPin,
  Users,
  Clock,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import type { Court, User } from '../../../../types/booking'
import { useSlots } from '../../../../hooks/useSlots'

export interface BookingFilters {
  search?: string
  courtId?: string
  userId?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  timeFrom?: string
  timeTo?: string
}

interface BookingFiltersProps {
  filters: BookingFilters
  onFiltersChange: (filters: BookingFilters) => void
  courts: Court[]
  users: User[]
  loading?: boolean
  className?: string
}


export function BookingFilters({
  filters,
  onFiltersChange,
  courts,
  users,
  loading = false,
  className,
}: BookingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Preparar parámetros para cargar horarios dinámicos
  const selectedCourtId = filters.courtId || courts[0]?.id || ''
  const selectedDate = filters.dateFrom || new Date()
  const { slots: slotsData, loading: slotsLoading } = useSlots(selectedCourtId, selectedDate)

  // Unificar tiempos de inicio y fin para las opciones
  const allTimes = Array.from(new Set((slotsData ?? []).flatMap(s => [s.startTime, s.endTime]))).sort()
  const startTimeOptions = Array.from(new Set((slotsData ?? []).map(s => s.startTime))).sort()
  const endTimeOptions = allTimes.filter(t => !filters.timeFrom || t > filters.timeFrom)

  const updateFilter = (key: keyof BookingFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const clearFilter = (key: keyof BookingFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length
  }

  const hasActiveFilters = getActiveFiltersCount() > 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Filtra las reservas por diferentes criterios
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(
        "space-y-4",
        !isExpanded && "hidden md:block"
      )}>
        {/* Búsqueda general */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, cancha o notas..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
            disabled={loading}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => clearFilter('search')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Separator />

        {/* Filtros principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cancha */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Cancha
            </Label>
            <Select
              value={filters.courtId || ''}
              onValueChange={(value) => updateFilter('courtId', value || undefined)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las canchas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las canchas</SelectItem>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Cliente
            </Label>
            <Select
              value={filters.userId || ''}
              onValueChange={(value) => updateFilter('userId', value || undefined)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los clientes</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Estado</Label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => updateFilter('status', value || undefined)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                {STATUS_KEYS.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={BOOKING_STATUS_COLORS[status]}>
                        {BOOKING_STATUS_LABELS[status]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rango de fechas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4" />
              Fecha desde
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !filters.dateFrom && 'text-muted-foreground'
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? (
                    format(filters.dateFrom, 'dd/MM/yyyy', { locale: es })
                  ) : (
                    'Fecha desde'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => updateFilter('dateFrom', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filtros adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha hasta */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !filters.dateTo && 'text-muted-foreground'
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? (
                    format(filters.dateTo, 'dd/MM/yyyy', { locale: es })
                  ) : (
                    'Fecha hasta'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => updateFilter('dateTo', date)}
                  disabled={(date) => filters.dateFrom ? date < filters.dateFrom : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hora desde */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Hora desde
            </Label>
            <Select
              value={filters.timeFrom || ''}
              onValueChange={(value) => updateFilter('timeFrom', value || undefined)}
              disabled={loading || slotsLoading || !filters.courtId || !filters.dateFrom}
            >
              <SelectTrigger>
                <SelectValue placeholder="Hora desde" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Cualquier hora</SelectItem>
                {startTimeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hora hasta */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hora hasta</Label>
            <Select
              value={filters.timeTo || ''}
              onValueChange={(value) => updateFilter('timeTo', value || undefined)}
              disabled={loading || slotsLoading || !filters.courtId || !filters.dateFrom}
            >
              <SelectTrigger>
                <SelectValue placeholder="Hora hasta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Cualquier hora</SelectItem>
                {endTimeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros activos */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filtros activos:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Búsqueda: &quot;{filters.search}&quot;
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter('search')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.courtId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Cancha: {courts.find(c => c.id === filters.courtId)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter('courtId')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.userId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Cliente: {users.find(u => u.id === filters.userId)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter('userId')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Estado: {BOOKING_STATUS_LABELS[filters.status as BookingStatus]}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter('status')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.dateFrom && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Desde: {format(filters.dateFrom, 'dd/MM/yyyy', { locale: es })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter('dateFrom')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Hasta: {format(filters.dateTo, 'dd/MM/yyyy', { locale: es })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter('dateTo')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.timeFrom && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Hora desde: {filters.timeFrom}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter('timeFrom')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.timeTo && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Hora hasta: {filters.timeTo}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter('timeTo')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


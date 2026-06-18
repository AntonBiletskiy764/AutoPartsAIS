from django.db import models

class AutoPart(models.Model):
    article = models.CharField(max_length=100, unique=True, verbose_name="Артикул")
    name = models.CharField(max_length=255, verbose_name="Назва деталі")
    category = models.CharField(max_length=150, verbose_name="Категорія")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Ціна")
    quantity = models.IntegerField(default=0, verbose_name="Поточний залишок")
    min_quantity = models.IntegerField(default=2, verbose_name="Критичний мінімум")
    location = models.CharField(max_length=100, blank=True, null=True, verbose_name="Місце на складі (Стелаж/Полиця)")

    def __str__(self):
        return f"{self.article} - {self.name}"

    @property
    def is_deficit(self):
        # Ця властивість автоматично визначатиме, чи товар у дефіциті
        return self.quantity <= self.min_quantity
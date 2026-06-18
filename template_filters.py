#!/usr/bin/env python
# -*- coding: utf-8 -*-

from datetime import datetime
from pelican import signals

def get_index_image_by_date(INDEX_IMAGE, INDEX_IMAGE_DAYS):
    """
    根据当前日期返回首页图片URL
    如果当天日期在INDEX_IMAGE_DAYS中配置了图片，则使用当天的图片
    否则使用默认的INDEX_IMAGE
    """
    if not INDEX_IMAGE_DAYS:
        return INDEX_IMAGE
    
    # 获取当前日期，格式为 MM-DD
    current_date = datetime.now().strftime('%m-%d')
    
    # 检查当前日期是否在配置中
    if current_date in INDEX_IMAGE_DAYS:
        return INDEX_IMAGE_DAYS[current_date]
    
    return INDEX_IMAGE

def add_template_filters(pelican):
    """添加自定义模板过滤器"""
    pelican.settings['INDEX_IMAGE_BY_DATE'] = get_index_image_by_date(
        pelican.settings.get('INDEX_IMAGE', ''),
        pelican.settings.get('INDEX_IMAGE_DAYS', {})
    )

def register():
    """注册信号处理器"""
    signals.initialized.connect(add_template_filters) 